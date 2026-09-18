import { expect, test } from '@playwright/test';

/**
 * O-21 (Track O, fase 12): Operador · Ventas. Figures agree with Inicio, Turno
 * and Cierre; a cancellation needs a reason and leaves the sale visible.
 */
test('the turno figures exclude the cancelled sale', async ({ page }) => {
  await page.goto('/operador/ventas');
  await expect(page.getByText('$3,120.00')).toBeVisible();
  await expect(page.getByText('$1,980.00')).toBeVisible();
  await expect(page.getByText('Cancelada', { exact: true })).toHaveCount(1);
});

test('cancelling needs a reason, keeps the sale, and moves the figures', async ({ page }) => {
  await page.goto('/operador/ventas');
  await page.getByTitle('Cancelar venta').first().click();
  const modal = page.getByRole('dialog');
  await expect(modal.getByRole('button', { name: 'Cancelar la venta' })).toBeDisabled();
  await modal.getByRole('button', { name: 'Cobro duplicado' }).click();
  await modal.getByRole('button', { name: 'Cancelar la venta' }).click();

  await expect(page.getByRole('status')).toContainText('V-0412 por $160.00 · Cobro duplicado.');
  await expect(page.getByText('Cancelada', { exact: true })).toHaveCount(2);
  await expect(page.getByText('$2,960.00')).toBeVisible();
});

test('search and method filters narrow the list', async ({ page }) => {
  await page.goto('/operador/ventas');
  await page.getByRole('button', { name: 'Fiado', exact: true }).click();
  await expect(page.getByText('V-0409')).toBeVisible();
  await expect(page.getByText('V-0412')).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByLabel('Buscar venta').fill('dona mari');
  await expect(page.getByText('V-0409')).toBeVisible();
  await page.getByLabel('Buscar venta').fill('nada así');
  await expect(page.getByText('Sin resultados')).toBeVisible();
});
