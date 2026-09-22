import { expect, test, type Page } from '@playwright/test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** The amber row chips only (the KPI label and a row's detail say it too). */
const sinChips = (page: Page) => page.locator('span').filter({ hasText: /^Sin comprobante$/ });

/** Register one gasto through the modal; the three fields gate the save. */
async function registrar(
  page: Page,
  monto: string,
  concepto: string,
  categoria: string,
): Promise<void> {
  await page.getByRole('button', { name: 'Registrar gasto' }).first().click();
  const modal = page.getByRole('dialog');
  const save = modal.getByRole('button', { name: 'Registrar gasto', exact: true });
  await modal.getByLabel('Monto').fill(monto);
  await modal.getByLabel('Concepto').fill(concepto);
  await modal.getByRole('button', { name: categoria, exact: true }).click();
  await save.click();
}

/**
 * O-23 (Track O, fase 12; real door O-38): Operador · Gastos. The register
 * starts empty — every figure here is one this test registered.
 */
test('an empty turno takes its first gasto, and the figures follow', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await expect(page.getByText('Sin gastos en este turno')).toBeVisible();

  await registrar(page, '150', 'Gas para la parrilla', 'Insumos');
  await expect(page.getByRole('status')).toContainText(
    '−$150.00 · Gas para la parrilla · Insumos · sin comprobante.',
  );
  await expect(page.getByText('$150.00').first()).toBeVisible();
  await expect(sinChips(page).first()).toBeVisible();
});

test('registering needs amount, concept and category before the save', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Registrar gasto' }).first().click();
  const modal = page.getByRole('dialog', { name: 'Registrar gasto de caja chica' });
  const save = modal.getByRole('button', { name: 'Registrar gasto', exact: true });
  await modal.getByLabel('Monto').fill('120');
  await modal.getByLabel('Concepto').fill('Hielo');
  await expect(save).toBeDisabled();
  await modal.getByRole('button', { name: 'Insumos' }).click();
  await save.click();

  await expect(page.getByRole('status')).toContainText(
    '−$120.00 · Hielo · Insumos · sin comprobante.',
  );
  await expect(page.getByText('Hielo', { exact: true }).first()).toBeVisible();
});

test('a receipt photo is attached, and a tap removes it', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await page.getByRole('button', { name: 'Registrar gasto' }).first().click();
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

test('search and category filters narrow the list', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/gastos');
  await registrar(page, '150', 'Gas para la parrilla', 'Insumos');
  await registrar(page, '80', 'Taxi por insumos', 'Transporte');

  await page.getByRole('button', { name: 'Transporte', exact: true }).click();
  await expect(page.getByText('Taxi por insumos').first()).toBeVisible();
  await expect(page.getByText('Gas para la parrilla', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByLabel('Buscar gasto').fill('taxi');
  await expect(page.getByText('Taxi por insumos').first()).toBeVisible();
  await page.getByLabel('Buscar gasto').fill('nada así');
  await expect(page.getByText('Sin resultados')).toBeVisible();
});
