import { expect, test } from './test';

import { puertaOperador } from './puerta-operador';

/**
 * O-24 (Track O, fase 12): Operador · Inventario. Entries and write-offs move
 * the stock; a write-off needs its reason; free adjustments stay the owner's.
 */
test.beforeEach(() => test.setTimeout(120_000));

test('stock shows what to restock and the owner-only rule', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/inventario');
  await expect(page.getByText('Reponer', { exact: true })).toHaveCount(4);
  await expect(page.getByText('el ajuste libre de existencias lo hace Pedro')).toBeVisible();
});

test('a write-off from the row needs a reason, lowers the stock and is listed', async ({
  page,
}) => {
  await puertaOperador(page);
  await page.goto('/operador/inventario');
  await page.getByTitle('Registrar merma').first().click();
  const modal = page.getByRole('dialog', { name: 'Registrar merma' });
  const save = modal.getByRole('button', { name: 'Registrar merma' });
  await modal.getByLabel('Cantidad').fill('3');
  await expect(save).toBeDisabled();
  await modal.getByRole('button', { name: 'Se rompió' }).click();
  await save.click();

  await expect(page.getByRole('status')).toContainText('−3 de Carne de pastor · Se rompió.');
  await page.getByRole('tab', { name: /Movimientos de mi turno/ }).click();
  await expect(page.getByText('−3 kg')).toBeAttached();
});

test('an entry needs a product and a quantity; the supplier is optional', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/inventario');
  await page.getByRole('button', { name: 'Entrada de mercancía' }).click();
  const modal = page.getByRole('dialog', { name: 'Entrada de mercancía' });
  await modal.getByLabel('Buscar en el catálogo').fill('aguacate');
  await modal.getByRole('button', { name: /Aguacate/ }).click();
  await modal.getByLabel('Cantidad').fill('4');
  await modal.getByRole('button', { name: 'Registrar entrada' }).click();
  await expect(page.getByRole('status')).toContainText('+4 de Aguacate. Queda en tu turno.');
});

test('the movements tab lists the turno', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/inventario');
  await page.getByRole('tab', { name: /Movimientos de mi turno/ }).click();
  await expect(page.getByText('Se cortó con el calor')).toBeAttached();
  await expect(page.getByText('+300 piezas')).toBeAttached();
});
