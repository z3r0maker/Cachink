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
  await page.getByRole('button', { name: 'Se echó a perder o se dañó Carne de pastor' }).click();
  const panel = page.getByRole('dialog', { name: '¿Qué pasó con la mercancía?' });
  await expect(
    panel.getByRole('radio', { name: 'Se echó a perder o se dañó (merma)' }),
  ).toHaveAttribute('aria-checked', 'true');
  await panel.getByLabel('¿Cuánto se echó a perder?').fill('3');
  const save = panel.getByRole('button', { name: 'Registrar merma de 3 kg' });
  await expect(save).toBeDisabled();
  await panel.getByRole('radio', { name: 'Se rompió' }).click();
  await save.click();

  await expect(page.getByRole('status')).toContainText('−3 de Carne de pastor · Se rompió.');
  await page.getByRole('tab', { name: /Movimientos de mi turno/ }).click();
  await expect(page.getByText('−3 kg')).toBeAttached();
});

test('a delivery from the row needs a quantity; who brought it is optional', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/inventario');
  await page.getByRole('button', { name: 'Llegó mercancía de Aguacate' }).click();
  const panel = page.getByRole('dialog', { name: '¿Qué pasó con la mercancía?' });
  await expect(panel.getByRole('radio', { name: 'Llegó mercancía' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await panel.getByLabel('¿Cuánto llegó?').fill('4');
  await panel.getByRole('button', { name: 'Registrar entrada de 4 kg' }).click();
  await expect(page.getByRole('status')).toContainText('+4 de Aguacate. Queda en tu turno.');
});

test('the movements tab lists the turno', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/inventario');
  await page.getByRole('tab', { name: /Movimientos de mi turno/ }).click();
  await expect(page.getByText('Se cortó con el calor')).toBeAttached();
  await expect(page.getByText('+300 piezas')).toBeAttached();
});
