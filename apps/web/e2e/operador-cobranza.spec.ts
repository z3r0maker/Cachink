import { expect, test } from '@playwright/test';

/**
 * O-25 (Track O, fase 12): Operador · Cobranza. An abono lands on the oldest
 * tickets first, lowers the balance, and joins today's abonos.
 */
test('the turno figures and the four clients', async ({ page }) => {
  await page.goto('/operador/cobranza');
  await expect(page.getByText('$1,780.00')).toBeVisible();
  await expect(page.getByText('Tres clientes con saldo')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sin saldo por cobrar' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

test('an abono applies to the oldest sales and lowers the balance', async ({ page }) => {
  await page.goto('/operador/cobranza');
  await page.getByRole('button', { name: 'Recibir abono' }).first().click();
  const modal = page.getByRole('dialog', { name: 'Abono de Doña Mari de la tienda' });
  await expect(modal.getByRole('button', { name: 'Registrar abono' })).toBeDisabled();
  await modal.getByRole('button', { name: '$200.00' }).click();
  await expect(modal.getByText('V-0361 · 8 may completa · V-0388 · 11 may parcial')).toBeVisible();
  await expect(modal.getByText('$140.00')).toBeVisible();
  await modal.getByRole('button', { name: 'Transferencia' }).click();
  await modal.getByRole('button', { name: 'Registrar abono' }).click();

  await expect(page.getByRole('status')).toContainText(
    '$200.00 de Doña Mari de la tienda por transferencia. Se aplicó a lo más antiguo; queda $140.00.',
  );
  await expect(page.getByText('$960.00')).toBeVisible();
});

test('filters and search narrow the clients', async ({ page }) => {
  await page.goto('/operador/cobranza');
  await page.getByRole('button', { name: 'Atrasados', exact: true }).click();
  await expect(page.getByText('Taller de Chuy').first()).toBeVisible();
  await expect(page.getByText('Oficina Delgado')).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByLabel('Buscar cliente').fill('nadie así');
  await expect(page.getByText('Sin resultados')).toBeVisible();
});
