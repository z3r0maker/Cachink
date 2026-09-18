import { expect, test, type Page } from '@playwright/test';

/** Below 1240 px the ticket is a sheet opened from the yellow «Cobrar» bar. */
async function ticket(page: Page) {
  const panel = page.getByRole('complementary', { name: 'Ticket' });
  if ((page.viewportSize()?.width ?? 1440) < 1240) {
    await page.locator('button', { hasText: /^\d+Cobrar/ }).click();
  }
  return panel;
}

/**
 * O-20 (Track O, fase 11) — the compuerta: «Una venta en efectivo con cambio y
 * una fiada con cliente se capturan completas; el total y COBRAR nunca se
 * pierden por largo el ticket.»
 */
test('a cash sale shows the change and starts a new ticket', async ({ page }) => {
  await page.goto('/operador/caja');
  const panel = await ticket(page);
  await expect(panel.getByText('$160.00')).toBeVisible();

  await panel.getByRole('button', { name: 'Cobrar' }).click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo' }).click();
  await cobro.getByRole('button', { name: '$200.00' }).click();
  await expect(cobro.getByText('$40.00')).toBeVisible();
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();

  const card = page.getByRole('status');
  await expect(card).toContainText('Venta registrada · $160.00');
  await expect(card).toContainText('$40.00');
  await expect(page.locator('aside[aria-label=Ticket]').getByText('Ticket vacío')).toBeAttached();
});

test('short cash keeps «Registrar venta» disabled and says what is missing', async ({ page }) => {
  await page.goto('/operador/caja');
  await (await ticket(page)).getByRole('button', { name: 'Cobrar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Efectivo' }).click();
  await page.getByLabel('Con cuánto paga').fill('100');
  await expect(page.getByRole('dialog').getByText('Falta')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar venta' })).toBeDisabled();
});

test('a credit sale needs a client, then adds to their balance', async ({ page }) => {
  await page.goto('/operador/caja');
  await (await ticket(page)).getByRole('button', { name: 'Cobrar' }).click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Fiado' }).click();
  await expect(cobro.getByRole('button', { name: 'Elige un cliente' })).toBeDisabled();
  await cobro.getByRole('button', { name: /Taller de Chuy/ }).click();
  await cobro.getByRole('button', { name: 'Registrar fiado' }).click();
  await expect(page.getByRole('status')).toContainText('Se sumó al saldo de Taller de Chuy.');
});

test('a long ticket never pushes the total or COBRAR out of view', async ({ page }) => {
  await page.goto('/operador/caja');
  const grid = page.locator('main');
  for (const name of [
    'Taco de suadero',
    'Taco de bistec',
    'Taco de chorizo',
    'Taco campechano',
    'Quesadilla',
    'Volcán',
    'Orden de pastor',
    'Agua de jamaica',
    'Refresco 600 ml',
    'Consomé',
    'Guacamole',
    'Cebollitas asadas',
  ]) {
    await grid
      .getByRole('button', { name: new RegExp(`^${name}`) })
      .first()
      .click();
  }
  const panel = await ticket(page);
  await expect(panel.getByRole('button', { name: 'Cobrar' })).toBeInViewport();
  await expect(panel.getByText('Total', { exact: true })).toBeInViewport();
});

test('«Deshacer» brings the sold lines back', async ({ page }) => {
  await page.goto('/operador/caja');
  await (await ticket(page)).getByRole('button', { name: 'Cobrar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tarjeta' }).click();
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.locator('aside[aria-label=Ticket]').getByText('Gringa')).toBeAttached();
});
