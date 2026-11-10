import { expect, test, type Page } from './test';

import { newUlid } from '@xangarro/domain';

import { turno } from './phone-rows';
import { pull, push, sale, ticket, type Phone } from './sync-phone';
import { activateOn, freeSlots } from './tenant-phone';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addOperator, addProduct } from './tenant-rows';

/**
 * The day boundary, with the phone as the origin (docs/testing/e2e-test-catalog.md
 * J10-20). The business is in America/Mexico_City (UTC−6, no DST since 2022):
 * a sale at 23:59 on the 11th is already 05:59 UTC on the 12th, and one at
 * 00:01 on the 12th is 06:01 UTC. The phone writes the business's day on the
 * row (`fecha`, `hora`); the cloud must keep it, never re-derive it from the
 * UTC timestamp — that is the bug this guards against: both sales on the 12th.
 *
 * Both sales are on one turno that Ana opened at 20:00 on the 11th and closed
 * at 01:00 on the 12th, so the corte counts both: a turno is its own, whatever
 * the calendar says (`cortes-figuras.ts` groups by `caja_turno_id`).
 */
test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

const AYER = '2026-05-11';
const HOY = '2026-05-12';

let t: Tenant;
let phone: Phone;
let ana = '';
let producto = '';

test.beforeAll(async ({ request }) => {
  t = await mintTenant({ label: 'Medianoche' });
  ana = await addOperator(t, { nombre: 'Ana Robledo' });
  producto = await addProduct(t, { nombre: 'Taco', precio: 1500 });
  await freeSlots(t);
  phone = await activateOn(request, t);
});

/** Ana's turno: opened 20:00 on the 11th, closed 01:00 on the 12th (Mexico City). */
const abierto = (id: string) =>
  turno(phone, {
    id,
    userId: ana,
    fecha: AYER,
    aperturaAt: '2026-05-12T02:00:00.000Z',
    fondo: 50000n,
  });
/** $500 fondo + two $45 cash sales, counted exactly. */
const cerrado = (id: string) => ({
  ...turno(
    phone,
    { id, userId: ana, fecha: AYER, aperturaAt: '2026-05-12T02:00:00.000Z', fondo: 50000n },
    {
      at: '2026-05-12T07:00:00.000Z',
      esperado: 59000n,
      conteo: { 'billete-500': 1, 'billete-50': 1, 'billete-20': 2 },
    },
  ),
  clientSeq: 2,
});

/** One $45 cash sale on the turno, at the business's `fecha` and `hora`. */
function venta(turnoId: string, fecha: string, hora: string, at: string, concepto: string) {
  const tk = ticket(phone, {
    fecha,
    hora,
    concepto,
    cajaTurnoId: turnoId,
    createdAt: at,
    updatedAt: at,
  });
  const linea = sale(phone, tk.rowId, {
    productoId: producto,
    fecha,
    concepto,
    createdAt: at,
    updatedAt: at,
  });
  return [tk, linea];
}

const counter = (page: Page) => page.locator('main').getByRole('status');

async function verDia(page: Page, dia: string, concepto: string, hora: string) {
  await page.goto(`/movimientos?rango=personalizado&desde=${dia}&hasta=${dia}`);
  await expect(counter(page)).toHaveText('Mostrando 1–1 de 1 movimientos');
  await page.locator('main tbody tr', { hasText: concepto }).click();
  const cajon = page.getByRole('dialog');
  await expect(cajon.getByText(`${dia} · ${hora}`)).toBeVisible();
  // The turno it was captured on: Ana's, opened on the 11th.
  await expect(cajon.getByText('Ana Robledo', { exact: true })).toBeVisible();
  await expect(cajon.getByText(AYER, { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
}

test('a sale at 23:59 and one at 00:01 land on their own days and on the same turno', async ({
  page,
  request,
}) => {
  const turnoId = newUlid();
  const antes = venta(turnoId, AYER, '23:59', '2026-05-12T05:59:00.000Z', 'Antes de medianoche');
  const despues = venta(turnoId, HOY, '00:01', '2026-05-12T06:01:00.000Z', 'Después de medianoche');
  const r = await (await push(request, phone, [abierto(turnoId), ...antes, ...despues])).json();
  expect(r.rejected, JSON.stringify(r.rejected)).toEqual([]);
  expect(r.accepted).toHaveLength(5);
  const cierre = await (await push(request, phone, [cerrado(turnoId)])).json();
  expect(cierre.rejected, JSON.stringify(cierre.rejected)).toEqual([]);
  expect((await pull(request, phone, phone.cursor)).acknowledgedThrough).toBeGreaterThanOrEqual(
    cierre.accepted[0].serverSeq,
  );

  await signIn(page, t);
  // Each sale on the day the phone wrote, not on UTC's day.
  await verDia(page, AYER, 'Antes de medianoche', '23:59');
  await verDia(page, HOY, 'Después de medianoche', '00:01');

  // One corte, holding both: two sales, $90 in cash on a $500 fondo.
  await page.goto('/cortes');
  const fila = page.getByRole('row', { name: /Ana Robledo/ }).first();
  await expect(fila).toBeVisible();
  await fila.click();
  const panel = page.getByRole('dialog', { name: 'Ana Robledo' });
  await expect(panel.getByText('Ventas capturadas').locator('..')).toHaveText(
    /^Ventas capturadas\s*2$/,
  );
  await expect(panel.getByText('Ventas en efectivo').locator('..')).toContainText('$90.00');
  await expect(panel.getByText('Esperado en caja').locator('..')).toContainText('$590.00');
});
