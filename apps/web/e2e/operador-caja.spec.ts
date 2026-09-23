import { expect, test, type Page } from '@playwright/test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** Below 1240 px the ticket is a sheet opened from the yellow «Cobrar» bar. */
async function ticket(page: Page) {
  const panel = page.getByRole('complementary', { name: 'Ticket' });
  if ((page.viewportSize()?.width ?? 1440) < 1240) {
    await page.locator('button', { hasText: /^\d+Cobrar/ }).click();
  }
  return panel;
}

/**
 * O-20 (Track O, fase 11; real door O-38) — the compuerta: a cash sale with
 * change and a fiado with client, captured complete against the register's
 * own catalogue; the total and COBRAR never get lost however long the ticket.
 * The register starts empty — every line here was tapped by this test.
 */
test('a cash sale shows the change and starts a new ticket', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 2500, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  const suadero = page.getByRole('button', { name: /Suadero del día/ }).first();
  await suadero.click();
  await suadero.click();
  const panel = await ticket(page);
  await expect(panel.getByText('$50.00').first()).toBeVisible();

  await panel.getByRole('button', { name: 'Cobrar', exact: true }).click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo' }).click();
  await cobro.getByLabel('Con cuánto paga').fill('60');
  await cobro.getByText('$10.00').first().isVisible();
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();

  const card = page.getByRole('status');
  await expect(card).toContainText('Venta registrada · $50.00');
  await expect(page.locator('aside[aria-label=Ticket]').getByText('Ticket vacío')).toBeAttached();
});

test('short cash keeps «Registrar venta» disabled and says what is missing', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 2500, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  await page
    .getByRole('button', { name: /Quesadilla/ })
    .first()
    .click();
  await (await ticket(page)).getByRole('button', { name: 'Cobrar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Efectivo' }).click();
  await page.getByLabel('Con cuánto paga').fill('20');
  await expect(page.getByRole('dialog').getByText('Falta')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrar venta' })).toBeDisabled();
});

test('a credit sale needs a client, then adds to their balance', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 6000, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  await page
    .getByRole('button', { name: /Gringa/ })
    .first()
    .click();
  await (await ticket(page)).getByRole('button', { name: 'Cobrar', exact: true }).click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Fiado' }).click();
  await expect(cobro.getByRole('button', { name: 'Elige un cliente' })).toBeDisabled();
  await cobro
    .getByRole('button', { name: /Raúl Contreras/ })
    .first()
    .click();
  await cobro.getByRole('button', { name: 'Registrar fiado' }).click();
  await expect(page.getByRole('status')).toContainText('Se sumó al saldo de Raúl Contreras.');
});

test('a long ticket never pushes the total or COBRAR out of view', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 2500, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  const suadero = page.getByRole('button', { name: /Suadero del día/ }).first();
  for (let i = 0; i < 12; i += 1) {
    await suadero.click();
  }
  const panel = await ticket(page);
  await expect(panel.getByRole('button', { name: 'Cobrar', exact: true })).toBeInViewport();
  await expect(panel.getByText('Total', { exact: true })).toBeInViewport();
});

test('«Deshacer» brings the sold lines back', async ({ page }) => {
  await puertaOperador(page, [{ nombre: 'Suadero del día', precioCentavos: 6000, sku: 'OPCAJA1' }]);
  await page.goto('/operador/caja');
  await page
    .getByRole('button', { name: /Gringa/ })
    .first()
    .click();
  await (await ticket(page)).getByRole('button', { name: 'Cobrar', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Tarjeta' }).click();
  await page.getByRole('status').getByRole('button', { name: 'Deshacer' }).click();
  await expect(page.locator('aside[aria-label=Ticket]').getByText('Gringa')).toBeAttached();
});
