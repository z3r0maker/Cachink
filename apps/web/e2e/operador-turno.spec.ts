import { expect, test } from './test';

import { puertaOperador } from './puerta-operador';

/**
 * O-15 (Track O, fase 10): Operador · Turno — the expected cash and its parts,
 * the recurring expenses still to capture, and every movement of the turno.
 */
test.beforeEach(() => test.setTimeout(120_000));

test('Turno shows the expected cash built from its four parts', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/turno');
  await expect(page.getByRole('heading', { level: 1, name: 'Tu turno' })).toBeVisible();
  await expect(page.getByText('$2,710.00')).toBeVisible();
  await expect(page.getByText('Cuatro con comprobante')).toBeVisible();
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

test('«Hoy no» hides a recurring expense and the count follows', async ({ page }, info) => {
  await puertaOperador(page);
  // Between 760 and ~1000 px the design's row squeezes the name to zero width
  // (reported for the design project, O-15); the behaviour is checked at desktop.
  // The operador project runs desktop-width; the viewport projects keep
  // their copy until the flag dies.
  test.skip(
    !['desktop', 'operador'].includes(info.project.name),
    'names are squeezed out below ~1000 px in the design',
  );
  await page.goto('/operador/turno');
  const pendientes = page.locator('section', { hasText: 'Pendientes de registrar' });
  await expect(pendientes.getByText('Renta del local')).toBeVisible();
  await pendientes.getByRole('button', { name: 'Hoy no' }).nth(1).click();
  await expect(pendientes.getByText('Renta del local')).toBeHidden();
  await expect(pendientes.getByRole('button', { name: 'Hoy no' })).toHaveCount(2);
});

test('the header offers «Nueva venta» and «Cerrar turno» leads to the close', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/turno');
  await expect(page.locator('header').getByRole('link', { name: 'Nueva venta' })).toBeVisible();
  await page.locator('main').getByRole('link', { name: 'Cerrar turno' }).click();
  await expect(page).toHaveURL(/\/operador\/cierre$/);
});
