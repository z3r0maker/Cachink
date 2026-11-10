import { expect, test, type Page } from './test';

import { hoyEn } from '@xangarro/domain';

import { asTenant, pull, push, sale, ticket, type Phone } from './sync-phone';
import { activateOn, freeSlots } from './tenant-phone';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addProduct } from './tenant-rows';

/**
 * Two phones on a tenant of their own (docs/testing/e2e-test-catalog.md J6-16,
 * J6-17), pushing over HTTP exactly as the app does.
 *
 * J6-16: a phone whose clock runs five weeks ahead still gets its row in — the
 * server never refuses a row for its date — and the row keeps the day the
 * phone wrote, while the server's clock, not the phone's, is what the pull
 * answers with (`serverTime`, the anchor A-10's `nowAnchored` reads) and the
 * owner's month is the server's (`PORTAL_TODAY` pins it to 2026-05-12).
 *
 * J6-17: folios are per device (ADR-073, `idx_tickets_device_folio`): two
 * phones that both reach V-0007 are two tickets, both stored, both found by
 * the owner's folio search, each on its own caja.
 */
test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

/** The suite's business day (playwright.config `PORTAL_TODAY`). */
const HOY = '2026-05-12';
const DIA_MS = 86_400_000;

let t: Tenant;
let a: Phone;
let b: Phone;
let producto = '';

test.beforeAll(async ({ request }) => {
  t = await mintTenant({ label: 'Reloj' });
  producto = await addProduct(t, { nombre: 'Taco', precio: 1500 });
  await freeSlots(t);
  a = await activateOn(request, t);
  b = await activateOn(request, t);
});

const counter = (page: Page) => page.locator('main').getByRole('status');
const buscar = (page: Page) => page.getByRole('textbox', { name: 'Buscar movimientos' });

test('a row from a phone whose clock runs ahead is accepted, dated as the phone dated it', async ({
  page,
  request,
}) => {
  // The phone thinks it is five weeks from now: its timestamps and its day.
  const adelante = new Date(Date.now() + 35 * DIA_MS);
  const at = adelante.toISOString();
  const dia = hoyEn(adelante);
  const concepto = `Venta del futuro ${a.deviceId.slice(-4)}`;
  const tk = ticket(a, { fecha: dia, concepto, createdAt: at, updatedAt: at });
  const linea = sale(a, tk.rowId, {
    productoId: producto,
    fecha: dia,
    concepto,
    createdAt: at,
    updatedAt: at,
  });

  const before = Date.now();
  const r = await (await push(request, a, [tk, linea])).json();
  expect(r.rejected, JSON.stringify(r.rejected)).toEqual([]);
  expect(r.accepted.map((x: { rowId: string }) => x.rowId)).toEqual([tk.rowId, linea.rowId]);
  // The answer carries the server's clock, five weeks behind the row.
  expect(Math.abs(Date.parse(r.serverTime) - before)).toBeLessThan(60_000);

  const [stored] = await asTenant(
    t.biz,
    (sql) => sql<{ fecha: string; m: string }[]>`
      SELECT fecha::text AS fecha, monto_centavos::text AS m FROM sales WHERE id = ${linea.rowId}`,
  );
  expect(stored).toEqual({ fecha: dia, m: '4500' });

  // What the phone anchors on next is the server's time, not its own.
  const got = await pull(request, a, a.cursor);
  expect(Math.abs(Date.parse(got.serverTime) - Date.now())).toBeLessThan(60_000);
  expect(Date.parse(got.serverTime)).toBeLessThan(Date.parse(at));

  // The owner's month is the server's: May, and the row is not in it…
  await signIn(page, t);
  await page.goto('/movimientos');
  await expect(page.getByRole('button', { name: 'Mayo 2026', exact: true })).toBeVisible();
  await expect(page.locator('main').getByText(concepto)).toHaveCount(0);
  // …it is on the day the phone wrote, where the owner can find it.
  await page.goto(`/movimientos?rango=personalizado&desde=${dia}&hasta=${dia}`);
  await expect(counter(page)).toHaveText('Mostrando 1–1 de 1 movimientos');
  await expect(page.locator('main tbody tr', { hasText: concepto })).toContainText('$45.00');
});

test('two phones pushing the same folio are two tickets, both stored', async ({
  page,
  request,
}) => {
  const folio = 7;
  const deA = ticket(a, { folio, fecha: HOY, concepto: 'Folio siete de A' });
  const deB = ticket(b, { folio, fecha: HOY, concepto: 'Folio siete de B' });
  const lineaA = sale(a, deA.rowId, {
    productoId: producto,
    fecha: HOY,
    concepto: 'Folio siete de A',
  });
  const lineaB = sale(b, deB.rowId, {
    productoId: producto,
    fecha: HOY,
    concepto: 'Folio siete de B',
  });

  const ra = await (await push(request, a, [deA, lineaA])).json();
  const rb = await (await push(request, b, [deB, lineaB])).json();
  expect(ra.rejected, JSON.stringify(ra.rejected)).toEqual([]);
  expect(rb.rejected, JSON.stringify(rb.rejected)).toEqual([]);
  expect(rb.accepted.map((x: { rowId: string }) => x.rowId)).toEqual([deB.rowId, lineaB.rowId]);

  const stored = await asTenant(
    t.biz,
    (sql) => sql<{ device_id: string }[]>`
      SELECT device_id FROM tickets WHERE folio = ${folio} ORDER BY device_id`,
  );
  expect(stored.map((s) => s.device_id)).toEqual([a.deviceId, b.deviceId].sort());

  // The owner's folio search finds both, each on the caja that captured it.
  await signIn(page, t);
  await page.goto('/movimientos');
  await buscar(page).fill(`#${folio}`);
  await expect(counter(page)).toHaveText('Mostrando 1–2 de 2 movimientos');
  for (const [concepto, phone] of [
    ['Folio siete de A', a],
    ['Folio siete de B', b],
  ] as const) {
    await page.locator('main tbody tr', { hasText: concepto }).click();
    const cajon = page.getByRole('dialog');
    await expect(cajon.getByText(`Venta · folio V-${folio}`)).toBeVisible();
    // The device is named after the code it was activated with (`tenant-phone.ts`).
    const [caja] = await asTenant(
      t.biz,
      (sql) => sql<{ nombre: string }[]>`SELECT nombre FROM devices WHERE id = ${phone.deviceId}`,
    );
    await expect(cajon.getByText(caja?.nombre ?? '?', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(cajon).toBeHidden();
  }
});
