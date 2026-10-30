import { expect, test, type Page } from './test';
import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * Ventas y gastos searches the folio and the operador, not only the concepto
 * (owner decision 2026-09-27, DS-01). The seed puts no ticket on a shift, so
 * this builds its own tenant: folio 7, folio 17 (which a substring search on
 * the folio would also match), and a concepto containing «7» captured on
 * Lupita's shift.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;

// Computed in beforeAll, not here: the module loads once per worker, and CI
// re-runs beforeAll against a database that already holds this tenant's rows

const counter = (page: Page) => page.locator('main').getByRole('status');
const conceptos = (page: Page) => page.locator('main tbody tr').allInnerTexts();

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Busqueda' });
  const [producto, lupita, turno] = [newUlid(), newUlid(), newUlid()];
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO products (id, nombre, categoria, costo_unit_centavos, unidad, business_id, device_id,
                            created_at, updated_at)
      VALUES (${producto}, 'Pan', 'Producto Terminado', 500, 'pza', ${t.biz}, ${t.deviceId}, now(), now())`;
    await sql`
      INSERT INTO users (id, nombre, pin_hash, active, business_id, device_id, created_at, updated_at)
      VALUES (${lupita}, 'Lupita Díaz', 'x', true, ${t.biz}, ${t.deviceId}, now(), now())`;
    await sql`
      INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, monto_apertura_centavos,
                               efectivo_adicional_centavos, business_id, device_id, created_at, updated_at)
      VALUES (${turno}, ${lupita}, '2026-05-10', now(), 0, 0, ${t.biz}, ${t.deviceId}, now(), now())`;
    for (const [folio, concepto, enTurno] of [
      [7, 'Concha', null],
      [17, 'Bolillo', null],
      [3, 'Pan de 7 granos', turno],
    ] as const) {
      const id = newUlid();
      await sql`
        INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago, caja_turno_id,
                             business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${folio}, '2026-05-10', ${concepto}, 'Efectivo', 'pagado', ${enTurno},
                ${t.biz}, ${t.deviceId}, now(), now())`;
      await sql`
        INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos,
                           producto_id, cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${id}, '2026-05-10', ${concepto}, 'Producto', 1000,
                ${producto}, 1, ${t.biz}, ${t.deviceId}, now(), now())`;
    }
  });
});

test('a folio, a number and an operator each find their ventas', async ({ page }) => {
  await signIn(page, t);
  await page.goto('/movimientos');
  await expect(counter(page)).toHaveText('Mostrando 1–3 de 3 movimientos');
  const buscar = page.getByRole('textbox', { name: 'Buscar movimientos' });

  await buscar.fill('#7');
  await expect(counter(page)).toHaveText('Mostrando 1–1 de 1 movimientos');
  expect((await conceptos(page)).join(' ')).toContain('Concha');

  // Folio 7 exactly, plus the concepto with a 7 in it; folio 17 is not «7».
  await buscar.fill('7');
  await expect(counter(page)).toHaveText('Mostrando 1–2 de 2 movimientos');
  const dos = (await conceptos(page)).join(' ');
  expect(dos).toContain('Concha');
  expect(dos).toContain('Pan de 7 granos');
  expect(dos).not.toContain('Bolillo');

  await buscar.fill('lupita');
  await expect(counter(page)).toHaveText('Mostrando 1–1 de 1 movimientos');
  expect((await conceptos(page)).join(' ')).toContain('Pan de 7 granos');
  await expect(page).toHaveURL(/q=lupita/);
});

test('an empty folio search says so, and the caption carries the search (DS-01)', async ({
  page,
}) => {
  await signIn(page, t);
  await page.goto('/movimientos');
  await expect(counter(page)).toHaveText('Mostrando 1–3 de 3 movimientos');

  await page.getByRole('textbox', { name: 'Buscar movimientos' }).fill('#412');
  await expect(
    page.getByText('No hay ninguna venta con el folio 412 en este periodo.'),
  ).toBeVisible();
  await expect(page.getByTestId('periodo-caption')).toHaveText(
    'Periodo: 1–31 may · con la búsqueda «#412»',
  );

  // Personalizado with no dates reads the whole history: the field says so.
  const pista = page.getByText('Elige un periodo para buscar más rápido');
  await expect(pista).toHaveCount(0);
  await page.getByRole('button', { name: 'Personalizado', exact: true }).click();
  await expect(pista).toBeVisible();
  await page.getByTestId('rango-desde').fill('2026-05-01');
  await page.getByTestId('rango-hasta').fill('2026-05-31');
  await expect(pista).toHaveCount(0);
});
