import { expect, test, type Locator, type Page } from './test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** Five near-simultaneous clicks; clicks that land on a disabled/gone button
 *  are swallowed — exactly what a human button-smash produces. */
async function smash(button: Locator): Promise<void> {
  await Promise.all(
    Array.from({ length: 5 }, () => button.click({ timeout: 2_000 }).catch(() => undefined)),
  );
}

/** Two of the product, tapped from the register's own catalogue. */
async function dos(page: Page, producto: RegExp): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
}

/**
 * Chaos 1 (caja; real door O-38): the register's own sale path under a
 * button smash — the toast replacement and the count-0 gate absorb it, and
 * exactly one sale lands. Moved here from chaos-1-impaciente so it runs in
 * the serial operador project (a real activation owns the device slots).
 */
test('operador: smashing Cobrar and Registrar venta yields ONE registered sale', async ({
  page,
}) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await dos(page, /Quesadilla/);

  const cobrar = page
    .getByRole('button', { name: 'Cobrar', exact: true })
    .filter({ visible: true })
    .first();
  await expect(cobrar).toBeEnabled();

  await smash(cobrar);

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await modal.getByRole('button', { name: 'Efectivo', exact: true }).click();
  // Two quesadillas are $80 — pay 100 so «Registrar venta» is enabled.
  await modal.getByLabel('Con cuánto paga').fill('100');

  await smash(modal.getByRole('button', { name: /^Registrar venta$/ }));

  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
  await expect(page.locator('aside[aria-label=Ticket]').getByText('Ticket vacío')).toBeAttached();
});
