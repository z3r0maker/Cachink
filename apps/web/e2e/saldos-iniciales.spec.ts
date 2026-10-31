import { expect, test, type Page } from './test';
import { newUlid } from '@xangarro/domain';

import { clickUntil, filledAll } from './interact';
import { asTenant } from './sync-phone';
import { mintTenant, signIn, type Tenant } from './tenant';

/**
 * N-17's end-to-end acceptance on a throwaway owner with no sales: the
 * opening caja and bancos captured in /saldos-iniciales are exactly the
 * Balance's «Efectivo», the cuentas por cobrar lines picked by hand are the
 * rows Postgres keeps, and «¿Cómo empiezo?» ticks its saldos row by itself.
 */
test.use({ storageState: { cookies: [], origins: [] } });

let t: Tenant;

const lupe = newUlid();
const beto = newUlid();

test.beforeAll(async () => {
  // Estados is a paid-plan screen, so the tenant pays for Xangarro — which is
  // `mintTenant`'s default plan.
  t = await mintTenant({ label: 'Saldos' });
  await asTenant(t.biz, async (sql) => {
    // Two clientes to owe the opening CxC: one kept, one picked and removed.
    for (const [id, nombre, telefono] of [
      [lupe, 'Doña Lupe Ramírez', '55 1111 2222'],
      [beto, 'Don Beto Salas', null],
    ] as const) {
      await sql`
        INSERT INTO clients (id, nombre, telefono, business_id, device_id, created_at, updated_at)
        VALUES (${id}, ${nombre}, ${telefono}, ${t.biz}, ${newUlid()}, now(), now())`;
    }
  });
});

test('captured opening cash is the Balance’s Efectivo, and the checklist ticks itself', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one throwaway tenant, one run');
  await signIn(page, t);

  await page.goto('/como-empiezo');
  const row = page
    .getByTestId('checklist-requerido')
    .locator('li', { hasText: 'Captura tus saldos iniciales' });
  await expect(row).toHaveAttribute('data-done', 'false');

  await page.goto('/saldos-iniciales');
  // Day one of the seed's month (PORTAL_TODAY is 2026-05-12, so the picker
  // opens on May). The picker's click is what proves hydration; the amounts
  // are then filled as one form and read back as one (see `filledAll`).
  const fecha = page.getByRole('button', { name: /^Fecha de apertura/ });
  await clickUntil(fecha, page.getByRole('dialog', { name: 'Elige la fecha de apertura' }));
  await page.getByRole('button', { name: '1 de mayo de 2026', exact: true }).click();
  await expect(fecha).toContainText('1 de mayo de 2026');
  await filledAll([
    [page.getByLabel('Efectivo en caja'), '5000'],
    [page.getByLabel('En bancos'), '12000'],
  ]);
  await expect(fecha).toContainText('1 de mayo de 2026');
  await capturarCxC(page);
  await page.getByRole('button', { name: 'Guardar saldos' }).click();
  await expect(page.getByText('Saldos guardados')).toBeVisible();

  // The kept line is the one row Postgres holds, in centavos, and it is what
  // the screen reads back after a reload.
  const lineas = await asTenant(
    t.biz,
    (sql) =>
      sql<{ cliente_id: string; saldo_centavos: string }[]>`
      SELECT cliente_id, saldo_centavos::text FROM opening_balance_clients
      WHERE business_id = ${t.biz} AND deleted_at IS NULL`,
  );
  expect(lineas).toEqual([{ cliente_id: lupe, saldo_centavos: '35000' }]);
  await page.reload();
  await expect(page.getByLabel('Saldo de Doña Lupe Ramírez')).toHaveValue(/^350(\.00)?$/);
  await expect(page.getByLabel('Saldo de Don Beto Salas')).toHaveCount(0);

  await page.goto('/estados');
  await page.getByRole('button', { name: 'Posición' }).click();
  const efectivo = page
    .locator('main')
    .getByText('Efectivo', { exact: true })
    .locator('xpath=ancestor::*[1]/..');
  await expect(efectivo).toContainText('$17,000.00');

  await page.goto('/como-empiezo');
  await expect(row).toHaveAttribute('data-done', 'true');
});

/**
 * The CxC lines by hand: «Agregar cliente» opens one pick at a time, the
 * picked cliente shows its phone, a line can be removed, and «Te deben» is
 * the sum of what is left.
 */
async function capturarCxC(page: Page): Promise<void> {
  const cxc = page.getByRole('region', { name: 'Cuentas por cobrar iniciales' });
  await expect(cxc.getByText('Sin saldos por cliente todavía.')).toBeVisible();
  const agregar = cxc.getByRole('button', { name: 'Agregar cliente' });

  await agregar.click();
  await expect(agregar).toBeHidden();
  await cxc.getByLabel('Elige un cliente').selectOption({ label: 'Doña Lupe Ramírez' });
  await expect(cxc.getByText('55 1111 2222')).toBeVisible();
  await cxc.getByLabel('Saldo de Doña Lupe Ramírez').fill('350');

  await agregar.click();
  const elegir = cxc.getByLabel('Elige un cliente');
  await expect(elegir.locator('option')).toHaveText(['Elige un cliente…', 'Don Beto Salas']);
  await elegir.selectOption({ label: 'Don Beto Salas' });
  await cxc.getByLabel('Saldo de Don Beto Salas').fill('120');
  await expect(cxc.getByText(/Te deben/)).toContainText('$470.00');

  await cxc.getByRole('button', { name: 'Quitar a Don Beto Salas' }).click();
  await expect(cxc.getByLabel('Saldo de Don Beto Salas')).toHaveCount(0);
  await expect(cxc.getByText(/Te deben/)).toContainText('$350.00');
}
