import { expect, test } from '@playwright/test';

/**
 * O-26 (Track O, fase 12): Operador · Detalle de cliente. The account is its
 * tickets and abonos; an abono re-derives the balance and the open tickets.
 */
test('from Cobranza to the account: balance, open tickets, history', async ({ page }) => {
  await page.goto('/operador/cobranza');
  await page.getByTitle('Ver historial').nth(1).click();
  await expect(page).toHaveURL(/\/operador\/cobranza\/chuy$/);
  await expect(page.getByText('$860.00')).toBeVisible();
  await expect(page.getByText('Ya abonó $400.00')).toBeVisible();
  await expect(page.getByText('Venta fiada V-0288')).toBeAttached();
  await expect(page.getByText('Se venció ayer')).toBeVisible();
  await expect(page.getByText('Vence el domingo')).toBeVisible();
  await expect(page.getByText(/se aplicó a V-0288 en parte$/)).toBeAttached();
});

test('an abono settles the oldest ticket and lowers the balance', async ({ page }) => {
  await page.goto('/operador/cobranza/chuy');
  await page.getByRole('button', { name: 'Recibir abono' }).click();
  const modal = page.getByRole('dialog', { name: 'Abono de Taller de Chuy' });
  await modal.getByRole('button', { name: '$500.00' }).click();
  await expect(modal.getByText('V-0288 completa · V-0310 parcial')).toBeVisible();
  await modal.getByRole('button', { name: 'Registrar abono' }).click();
  await expect(page.getByRole('status')).toContainText(
    '$500.00 por efectivo. Se aplicó a lo más antiguo; queda $360.00.',
  );
  await expect(page.getByText('Ya abonó $100.00')).toBeVisible();
});

test('the WhatsApp reminder carries the live balance and needs ten digits', async ({ page }) => {
  await page.goto('/operador/cobranza/mari');
  await page.getByRole('button', { name: 'Recordarle por WhatsApp' }).click();
  const modal = page.getByRole('dialog', { name: 'Recordarle su saldo' });
  await expect(modal).toContainText('tiene $340.00 pendiente en Taquería Don Pedro');
  await modal.getByLabel('Teléfono').fill('55 12');
  await expect(modal.getByRole('button', { name: 'Enviar por WhatsApp' })).toBeDisabled();
});

test('a client without an account gets the empty state', async ({ page }) => {
  await page.goto('/operador/cobranza/nadie');
  await expect(page.getByText('Este cliente no tiene cuenta abierta')).toBeVisible();
});
