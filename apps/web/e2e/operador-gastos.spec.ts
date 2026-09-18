import { expect, test, type Page } from '@playwright/test';

/** The amber row chips only (the KPI label and a row's detail say it too). */
const sinChips = (page: Page) => page.locator('span').filter({ hasText: /^Sin comprobante$/ });

/**
 * O-23 (Track O, fase 12): Operador · Gastos. Amount, concept and category are
 * required; the receipt is optional and its absence is counted.
 */
test('the turno figures: six expenses, $1,530.00 out, two without a receipt', async ({ page }) => {
  await page.goto('/operador/gastos');
  await expect(page.getByText('$1,530.00')).toBeVisible();
  await expect(sinChips(page)).toHaveCount(2);
});

test('registering needs amount, concept and category, then lands on top', async ({ page }) => {
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  const modal = page.getByRole('dialog', { name: 'Registrar gasto de caja chica' });
  const save = modal.getByRole('button', { name: 'Registrar gasto' });
  await modal.getByLabel('Monto').fill('120');
  await modal.getByLabel('Concepto').fill('Hielo');
  await expect(save).toBeDisabled();
  await modal.getByRole('button', { name: 'Insumos' }).click();
  await save.click();

  await expect(page.getByRole('status')).toContainText(
    '−$120.00 · Hielo · Insumos · sin comprobante.',
  );
  await expect(page.getByText('$1,650.00')).toBeVisible();
  await expect(sinChips(page)).toHaveCount(3);
});

test('a receipt photo is attached, and a tap removes it', async ({ page }) => {
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Registrar gasto' }).click();
  await page.getByLabel('Foto del comprobante').setInputFiles({
    name: 'ticket-14-52.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('jpg'),
  });
  const card = page.getByRole('button', { name: /Comprobante adjunto/ });
  await expect(card).toContainText('ticket-14-52.jpg · toca para quitarlo');
  await card.click();
  await expect(page.getByRole('button', { name: /Tomar foto del comprobante/ })).toBeVisible();
});

/** Presence, not visibility: at 760–1000 px the file's row squeezes the concept to zero (§4b). */
test('search and category filters narrow the list', async ({ page }) => {
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Transporte', exact: true }).click();
  await expect(page.getByText('Taxi por insumos')).toBeAttached();
  await expect(page.getByText('Carbón', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByLabel('Buscar gasto').fill('flama');
  await expect(page.getByText('Carbón', { exact: true })).toBeAttached();
  await page.getByLabel('Buscar gasto').fill('nada así');
  await expect(page.getByText('Sin resultados')).toBeVisible();
});
