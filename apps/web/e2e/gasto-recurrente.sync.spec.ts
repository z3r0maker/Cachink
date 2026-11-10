import { expect, test, type Page } from './test';

import { newUlid } from '@xangarro/domain';

import { gasto } from './phone-rows';
import { asTenant, pull, push, type Phone } from './sync-phone';
import { activateOn, freeSlots } from './tenant-phone';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * The recurring gasto chain, cloud side (docs/testing/e2e-test-catalog.md
 * J10-12): a template due today reaches the phone, the phone pays it exactly
 * as `ProcesarGastoRecurrenteUseCase` does (an egreso linked to the template,
 * dated today), and the owner's Movimientos has the gasto.
 *
 * The portal cannot create a template yet — «Gastos recurrentes templates
 * (portal CRUD; app already fires them)» is post-launch (docs/plan/
 * 08-post-launch.md) — so the row is written here as that CRUD would write
 * it, before the phone links. The phone's «Pendientes de registrar» and its
 * clearing are the phone's own screens (Maestro `gastos-pagar-recurrente`).
 */
test.describe.configure({ mode: 'serial' });
test.use({ storageState: { cookies: [], origins: [] } });

/** The suite's business day (playwright.config `PORTAL_TODAY`). */
const HOY = '2026-05-12';
const CONCEPTO = 'Recibo de luz';

let t: Tenant;
let phone: Phone;
const plantilla = newUlid();

test.beforeAll(async ({ request }) => {
  t = await mintTenant({ label: 'Recurrente' });
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO recurring_expenses (id, concepto, categoria, monto_centavos, proveedor, frecuencia,
                                      dia_del_mes, proximo_disparo, activo, business_id, device_id,
                                      created_at, updated_at)
      VALUES (${plantilla}, ${CONCEPTO}, 'Servicios', 85000, 'CFE', 'mensual', 12, ${HOY}, true,
              ${t.biz}, ${t.deviceId}, now(), now())`;
  });
  await freeSlots(t);
  phone = await activateOn(request, t);
});

const fila = (page: Page) => page.locator('main tbody tr', { hasText: CONCEPTO });

test('a template due today reaches the phone, is paid there, and lands in Movimientos', async ({
  page,
  request,
}) => {
  // The phone's bootstrap carries it, due: its next firing is today.
  const boot = await pull(request, phone, 0);
  const due = boot.tables.recurring_expenses.find((r: { id: string }) => r.id === plantilla);
  expect(due, 'the template rides the bootstrap').toBeDefined();
  expect(due.proximoDisparo <= HOY).toBe(true);
  expect(due.montoCentavos).toBe('85000');

  // Paid on the phone: the egreso the use case writes, tied to its template.
  const pago = gasto(phone, {
    fecha: HOY,
    concepto: due.concepto,
    categoria: due.categoria,
    monto: BigInt(due.montoCentavos),
    gastoRecurrenteId: plantilla,
    at: '2026-05-12T16:00:00.000Z',
  });
  const r = await (await push(request, phone, [pago])).json();
  expect(r.rejected, JSON.stringify(r.rejected)).toEqual([]);
  expect(r.accepted.map((x: { rowId: string }) => x.rowId)).toEqual([pago.rowId]);
  const [stored] = await asTenant(
    t.biz,
    (sql) => sql<{ plantilla: string; m: string }[]>`
      SELECT gasto_recurrente_id AS plantilla, monto_centavos::text AS m
      FROM expenses WHERE id = ${pago.rowId}`,
  );
  expect(stored).toEqual({ plantilla, m: '85000' });

  // The owner's ledger has it, once, with its amount and category.
  await signIn(page, t);
  await page.goto('/movimientos?tab=gastos');
  await expect(fila(page)).toHaveCount(1);
  await expect(fila(page)).toContainText('$850.00');
  await fila(page).click();
  const cajon = page.getByRole('dialog');
  await expect(cajon.getByText('Servicios', { exact: true })).toBeVisible();
  await expect(cajon.getByText(HOY, { exact: true })).toBeVisible();
});
