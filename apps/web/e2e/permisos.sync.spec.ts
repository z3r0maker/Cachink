import { expect, test } from './test';

import { asTenant } from './sync-phone';
import { mintTenant, signIn, stamp, type Tenant } from './tenant';

/**
 * P-05's permissions editor on a throwaway **Xangarrote** tenant (the plan
 * that includes per-operator permissions): «Editar permisos» turns on «Puede
 * cancelar ventas», stored as the JSON phones parse and logged for them. The
 * seeded tenant is on Xangarro, where the editor must be absent.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;
/** Typed into the dialog, so it carries the tenant's own stamp. */
let operador = '';

test.beforeAll(async () => {
  // Xangarrote is the plan that includes per-operator permissions; the seeded
  // tenant is on Xangarro, where the editor must be absent.
  t = await mintTenant({ label: 'Permisos', plan: 'xangarrote' });
  operador = `Beto ${stamp()}`;
});

test('on Xangarrote an operator can be allowed to cancel sales', async ({ page }) => {
  await signIn(page, t);
  await page.goto('/equipo');
  await page.getByRole('button', { name: 'Nuevo operador' }).click();
  await page.getByTestId('operador-nombre').fill(operador);
  await page.getByTestId('operador-pin').fill('2468');
  await page.getByTestId('operador-pin-confirmar').fill('2468');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.locator('main').getByText(operador)).toBeVisible();

  await page.getByRole('button', { name: 'Editar permisos' }).click();
  await page.getByRole('switch', { name: 'Puede cancelar ventas' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  // The switch's own label reads «Puede cancelar ventas» too, so seeing the
  // text proved nothing: wait for the dialog to close (the save committed)
  // before reading the database — under full-suite load it read `false`.
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('Puede cancelar ventas', { exact: true }).first()).toBeVisible();

  const [row] = await asTenant(
    t.biz,
    (sql) => sql`
      SELECT u.permissions,
             (SELECT count(*)::int FROM sync_log l WHERE l.table_name = 'users' AND l.row_id = u.id) AS logged
        FROM users u WHERE u.nombre = ${operador}`,
  );
  expect(JSON.parse(String(row?.permissions))).toEqual({ canCancelSales: true });
  expect(row?.logged).toBe(2);
});
