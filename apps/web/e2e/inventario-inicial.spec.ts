import { expect, test } from './test';
import { hashPassword } from '@xangarro/auth-core';
import { newUlid } from '@xangarro/domain';
import { randomUUID } from 'node:crypto';

import { asTenant } from './sync-phone';

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

const sello = randomUUID();
const email = `inventario-${sello}@test.mx`;
const biz = newUlid();
const TORTILLA = 'Tortilla (kg)';
const SALSA = 'Salsa verde (lt)';

test.beforeAll(async () => {
  const userId = randomUUID();
  const hash = await hashPassword('inventario-123');
  const device = newUlid();
  await asTenant(biz, async (sql) => {
    await sql`INSERT INTO auth.users (id, email, encrypted_password) VALUES (${userId}::uuid, ${email}, ${hash})`;
    await sql`
      INSERT INTO businesses (id, nombre, regimen_fiscal, isr_tasa, business_id, device_id, created_at, updated_at)
      VALUES (${biz}, ${`Inventario ${sello}`}, 'RESICO', 125, ${biz}, ${device}, now(), now())`;
    await sql`
      INSERT INTO business_members (id, user_id, role, business_id, created_at, updated_at)
      VALUES (${newUlid()}, ${userId}, 'owner', ${biz}, now(), now())`;
    for (const [nombre, costo] of [
      [TORTILLA, 1250],
      [SALSA, 300],
    ] as const) {
      await sql`
        INSERT INTO products (id, nombre, sku, categoria, costo_unit_centavos, unidad,
                              umbral_stock_bajo, tipo, seguir_stock, precio_venta_centavos,
                              business_id, device_id, created_at, updated_at)
        VALUES (${newUlid()}, ${nombre}, ${`INV-${nombre.length}`}, 'Materia Prima', ${costo}, 'pza', 3,
                'producto', true, 0, ${biz}, ${device}, now(), now())`;
    }
  });
});

test('the grid captures the opening stock once, at the typed cost', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one throwaway tenant, one run');
  await page.goto('/login');
  await page.getByTestId('login-door-owner').click();
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('inventario-123');
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));

  await page.goto('/inventario-inicial');
  // Real rows: this tenant's two products, their catalogue cost prefilled.
  await expect(page.getByLabel(`Costo de ${TORTILLA}`)).toHaveValue('12.50');
  await expect(page.getByLabel(`Costo de ${SALSA}`)).toHaveValue('3.00');

  // A .csv fills what matches the catalogue and names what does not.
  await page.getByLabel('Prellenar desde .csv').setInputFiles({
    name: 'inventario.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`producto,cantidad,costo\n${TORTILLA},4,\nChile fantasma,9,1\n`),
  });
  await expect(page.getByText('Sin match en tu catálogo: Chile fantasma')).toBeVisible();
  await expect(page.getByLabel(`Cantidad de ${TORTILLA}`)).toHaveValue('4');

  await page.getByLabel(`Cantidad de ${SALSA}`).fill('10');
  // 4 × $12.50 + 10 × $3.00, computed before anything is written.
  await expect(page.getByTestId('valuacion-inicial')).toContainText('$80.00');
  await page.getByRole('button', { name: 'Capturar 2 productos' }).click();
  // The confirmation survives the capture's own revalidation, which swaps the
  // grid for the done state: both are on screen together.
  await expect(page.getByText('Capturado: 2 productos, valuación $80.00.')).toBeVisible();
  await expect(page.getByText('Ya está capturado')).toBeVisible();

  const movimientos = await asTenant(
    biz,
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
  await expect(page.getByRole('button', { name: /Capturar/ })).toHaveCount(0);
});
