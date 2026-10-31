import { expect, test } from './test';
import { newUlid } from '@xangarro/domain';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * «Captura tu inventario inicial» (N-17) end to end, on a throwaway owner
 * whose catalogue this file writes: the grid lists the real products, a .csv
 * prefills what matches and names what does not, the capture writes one
 * apertura movement per product at the typed cost, and a second visit shows
 * the done state rather than a second capture.
 *
 * Its own tenant, so it never writes Taquería (ADR-103) and runs in one
 * viewport project only.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;

const TORTILLA = 'Tortilla (kg)';
const SALSA = 'Salsa verde (lt)';

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Inventario' });
  await asTenant(t.biz, async (sql) => {
    for (const [nombre, costo] of [
      [TORTILLA, 1250],
      [SALSA, 300],
    ] as const) {
      await sql`
        INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                              umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                              business_id, device_id, created_at, updated_at)
        VALUES (${newUlid()}, ${nombre}, ${`INV-${nombre.length}`}, 'Materia Prima', ${costo}, 'pza', 3,
                'producto', true, 0, ${t.biz}, ${t.deviceId}, now(), now())`;
    }
  });
});

test('the grid captures the opening stock once, at the typed cost', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one throwaway tenant, one run');
  await signIn(page, t);

  await page.goto('/inventario-inicial');
  // Real rows: this tenant's two products, their catalogue cost prefilled.
  await expect(page.getByLabel(`Costo unitario de ${TORTILLA}`)).toHaveValue('12.50');
  await expect(page.getByLabel(`Costo unitario de ${SALSA}`)).toHaveValue('3.00');

  // A .csv fills what matches the catalogue and names what does not. The grid
  // sits under the portal's loading boundary and can hydrate after the root
  // (ADR-103): a file set before that is dropped, so the upload is what retries.
  const csv = {
    name: 'inventario.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`producto,cantidad,costo\n${TORTILLA},4,\nChile fantasma,9,1\n`),
  };
  await expect(async () => {
    await page.getByLabel('Prellenar desde CSV').setInputFiles(csv);
    await expect(page.getByLabel(`Cantidad de ${TORTILLA}`)).toHaveValue('4', { timeout: 1_000 });
  }).toPass({ timeout: 20_000, intervals: [250, 500, 1_000] });
  await expect(page.getByText('Sin match en tu catálogo: Chile fantasma')).toBeVisible();

  await page.getByLabel(`Cantidad de ${SALSA}`).fill('10');
  // 4 × $12.50 + 10 × $3.00, computed before anything is written.
  await expect(page.getByTestId('valuacion-inicial')).toContainText('$80.00');
  await page.getByRole('button', { name: 'Guardar inventario inicial' }).click();
  // The confirmation survives the capture's own revalidation, which swaps the
  // grid for the done state: both are on screen together.
  await expect(page.getByText('Capturado: 2 productos, valuación $80.00.')).toBeVisible();
  await expect(page.getByText('Ya está capturado')).toBeVisible();

  const movimientos = await asTenant(
    t.biz,
    (sql) => sql<{ cantidad: number; costo: string }[]>`
      SELECT cantidad, costo_unit_centavos::text AS costo FROM inventory_movements
      ORDER BY cantidad`,
  );
  expect(movimientos.map((m) => [m.cantidad, m.costo])).toEqual([
    [4, '1250'],
    [10, '300'],
  ]);

  // One time only: a second visit is the done state, with nothing to capture.
  await page.reload();
  await expect(page.getByText('Ya está capturado')).toBeVisible();
  await expect(page.getByText(/^Capturado:/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Guardar inventario/ })).toHaveCount(0);
});
