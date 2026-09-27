import { expect, test, type Page } from './test';
import { venderEfectivo } from './cobrar';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** This test's own catalogue (chaos-proof: the portal specs own the seed). */
const PRODUCTOS = [{ nombre: 'Orden del día', precioCentavos: 4000, sku: 'OPINICIO1' }] as const;

/** A KPI tile read as its label, value and hint run together. */
const stat = (page: Page, texto: RegExp) => page.locator('main div').filter({ hasText: texto });

/** The design fixture's day: none of it may show on a linked caja. */
async function sinFixture(page: Page): Promise<void> {
  for (const f of [
    '$2,710.00',
    'Una cancelada a las 12:58',
    'Registrar el gas de la semana',
    'Jueves 14 de mayo',
    'Aclara el corte del 13 de mayo',
  ]) {
    await expect(page.getByText(f)).toHaveCount(0);
  }
  // The owner's messages are Avisos'; Inicio hides the panel while live.
  await expect(page.getByText(/^De parte de /)).toHaveCount(0);
}

/**
 * O-14 (Track O, fase 10; real data O-39): Operador · Inicio answers «what do
 * I do now» from the linked caja's own turno ($500 fondo from the door).
 */
test('before the first sale, Inicio says so and expects the fondo', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page.goto('/operador');
  await expect(
    page.getByRole('heading', { level: 1, name: '¡Buenas tardes, Ana! La caja está lista.' }),
  ).toBeVisible();
  await expect(page.getByText('Turno abierto desde las')).toBeVisible();
  await expect(
    page.getByText('Todavía no hay ventas en este turno. La primera se cobra desde aquí.'),
  ).toBeVisible();
  await expect(stat(page, /^Efectivo esperado\$500\.00/).first()).toBeVisible();
  await sinFixture(page);
});

test('after one cash sale, the figures and «Lo primero» follow', async ({ page }) => {
  await puertaOperador(page, PRODUCTOS);
  await page
    .getByRole('button', { name: /Orden del día/ })
    .first()
    .click();
  await venderEfectivo(page, '50');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  await page.goto('/operador');
  await expect(page.getByText('La caja está lista', { exact: true })).toBeVisible();
  await expect(page.getByText(/^Llevas 1 venta en este turno\. La última fue hace /)).toBeVisible();
  for (const label of ['Ventas del turno', 'Cobrado', 'Efectivo esperado', 'Fiado de hoy']) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(stat(page, /^Ventas del turno1Ninguna cancelada$/).first()).toBeVisible();
  await expect(stat(page, /^Efectivo esperado\$540\.00/).first()).toBeVisible();
  await expect(stat(page, /^Fiado de hoy\$0\.00/).first()).toBeVisible();
  await sinFixture(page);

  await page.reload();
  await expect(stat(page, /^Efectivo esperado\$540\.00/).first()).toBeVisible();
  await page.locator('main').getByRole('link', { name: 'Cobrar', exact: true }).click();
  await expect(page).toHaveURL(/\/operador\/caja$/);
});
