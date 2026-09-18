import { expect, test, type Page } from '@playwright/test';

/**
 * O-28 (Track O, fase 12): Operador · Cierre de turno. Unsent records block
 * the close; a difference needs a reason and a note; a balanced count closes.
 */
async function vaciarCola(page: Page) {
  await page.getByRole('button', { name: 'Reintentar envío' }).click();
  await expect(page.getByText('registros sin enviar', { exact: false })).toHaveCount(0);
}

async function contar(page: Page, piezas: Record<string, string>) {
  for (const [d, n] of Object.entries(piezas))
    await page.getByLabel(`Cantidad de $${d}`, { exact: true }).fill(n);
}

test('unsent records block the close until they go up', async ({ page }) => {
  await page.goto('/operador/cierre');
  await expect(page.getByText('Tienes 3 registros sin enviar.')).toBeVisible();
  await expect(page.getByText(/Espera a que terminen de subir\.$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cerrar turno' })).toBeDisabled();
  await vaciarCola(page);
  await expect(page.getByText('$2,710.00').first()).toBeVisible();
});

test('the count starts at zero, a whole shortfall', async ({ page }) => {
  await page.goto('/operador/cierre');
  await expect(page.getByLabel('Cantidad de $1000')).toHaveValue('0');
  await expect(page.getByText('Falta', { exact: true })).toBeVisible();
});

test('a surplus needs a reason and a note before closing', async ({ page }) => {
  await page.goto('/operador/cierre');
  await vaciarCola(page);
  await contar(page, { 1000: '3', 500: '1', 100: '1', 10: '1' });
  await expect(page.getByText('Sobra', { exact: true })).toBeVisible();
  await expect(page.getByText('$900.00')).toBeVisible();
  const cerrar = page.getByRole('button', { name: 'Cerrar turno' });
  await page.getByRole('button', { name: 'Propinas' }).click();
  await expect(cerrar).toBeDisabled();
  await page.getByLabel('Nota').fill('Me dejaron propina');
  await cerrar.click();
  await expect(page.getByText('Quedó un sobrante explicado como «Propinas».')).toBeVisible();
  await expect(page.getByText('+$900.00')).toBeVisible();
});

test('a balanced count closes without a note', async ({ page }) => {
  await page.goto('/operador/cierre');
  await vaciarCola(page);
  await contar(page, { 1000: '2', 500: '1', 200: '1', 10: '1' });
  await expect(page.getByText('Cuadra', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar turno' }).click();
  await expect(page.getByText('Turno cerrado')).toBeVisible();
  await expect(
    page.getByText('El conteo cuadró con lo esperado. Pedro ya lo tiene en su portal.'),
  ).toBeVisible();
});

test('the steppers change the count and its amount', async ({ page }) => {
  await page.goto('/operador/cierre');
  const row = page.getByLabel('Cantidad de $1000');
  await expect(row).toHaveValue('0');
  await page.getByTitle('Uno más').first().click();
  await expect(row).toHaveValue('1');
  await expect(page.getByText('$1,000.00').first()).toBeVisible();
});
