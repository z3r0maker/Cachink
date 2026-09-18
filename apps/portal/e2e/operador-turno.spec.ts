import { expect, test } from '@playwright/test';

/**
 * O-15 (Track O, fase 10): Operador · Turno — the expected cash and its parts,
 * the recurring expenses still to capture, and every movement of the turno.
 */
test('Turno shows the expected cash built from its four parts', async ({ page }) => {
  await page.goto('/operador/turno');
  await expect(page.getByRole('heading', { level: 1, name: 'Tu turno' })).toBeVisible();
  await expect(page.getByText('$2,870.00')).toBeVisible();
  for (const part of [
    'Fondo de caja',
    'Ventas en efectivo',
    'Abonos en efectivo',
    'Gastos de caja chica',
  ]) {
    await expect(page.getByText(part, { exact: true })).toBeVisible();
  }
  await expect(page.getByText('Venta V-0412')).toBeVisible();
});

test('«Hoy no» hides a recurring expense and the count follows', async ({ page }) => {
  await page.goto('/operador/turno');
  const pendientes = page.locator('section', { hasText: 'Pendientes de registrar' });
  await expect(pendientes.getByText('Renta del local')).toBeVisible();
  await pendientes.getByRole('button', { name: 'Hoy no' }).nth(1).click();
  await expect(pendientes.getByText('Renta del local')).toBeHidden();
  await expect(pendientes.getByRole('button', { name: 'Hoy no' })).toHaveCount(2);
});

test('the header offers «Nueva venta» and «Cerrar turno» leads to the close', async ({ page }) => {
  await page.goto('/operador/turno');
  await expect(page.locator('header').getByRole('link', { name: 'Nueva venta' })).toBeVisible();
  await page.locator('main').getByRole('link', { name: 'Cerrar turno' }).click();
  await expect(page).toHaveURL(/\/operador\/cierre$/);
});
