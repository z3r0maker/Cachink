import { expect, test, type Page } from './test';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** Sell two of a product in cash; returns nothing (the folio is V-0001). */
async function venderEfectivo(page: Page, producto: RegExp, efectivo: string): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await cobro.getByLabel('Con cuánto paga').fill(efectivo);
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/** Fiado sale on the client's account. */
async function fiar(page: Page, producto: RegExp, cliente: RegExp): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Fiado', exact: true }).click();
  await cobro.getByRole('button', { name: cliente }).first().click();
  await cobro.getByRole('button', { name: 'Registrar fiado' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/**
 * O-22 (Track O, fase 12; real door O-38): Detalle de venta over this test's
 * own tickets — the folio this register minted, not the fixture's.
 */
test('a ticket from the list shows its lines, cash received and change', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Quesadilla/, '100');
  await page.getByRole('link', { name: 'Ventas' }).click();
  await page.getByTitle('Ver el ticket').first().click();
  await expect(page).toHaveURL(/\/operador\/ventas\/V-0001$/);
  await expect(page.getByText('Venta V-0001')).toBeVisible();
  await expect(page.getByText('Quesadilla')).toBeVisible();
  await expect(page.getByText('Recibido en efectivo')).toBeVisible();
  await expect(page.getByText('$20.00')).toBeVisible();
  await expect(page.getByText('Venta registrada y enviada')).toBeVisible();
});

test('cancelling needs the NIP and a reason, and never deletes it', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Quesadilla/, '100');
  await page.goto('/operador/ventas/V-0001');
  await page.getByRole('button', { name: 'Cancelar venta' }).click();
  const modal = page.getByRole('dialog', { name: 'Cancelar V-0001' });
  await expect(modal.getByRole('button', { name: 'Cancelar la venta' })).toBeDisabled();
  await modal.getByRole('button', { name: 'Producto equivocado' }).click();
  await modal.getByTestId('cancelar-nip').fill('2580');
  await modal.getByRole('button', { name: 'Cancelar la venta' }).click();

  await expect(page.getByText('Venta cancelada')).toBeVisible();
  await expect(page.getByText('Producto equivocado')).toBeVisible();
  await expect(page.getByText('Sí, con su cancelación')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar venta' })).toBeDisabled();
});

test('a fiado ticket shows the client, and cancelling explains the saldo a favor', async ({
  page,
}) => {
  await puertaOperador(page, [
    { nombre: 'Orden del detalle', precioCentavos: 6000, sku: 'OPDET1' },
  ]);
  await page.goto('/operador/caja');
  await fiar(page, /Orden del detalle/, /Doña Mari de la tienda/);
  await page.goto('/operador/ventas/V-0001');
  await expect(page.getByText('Esta venta quedó fiada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Recibir un abono' })).toHaveAttribute(
    'href',
    '/operador/cobranza',
  );
  await page.getByRole('button', { name: 'Cancelar venta' }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'el saldo de Doña Mari de la tienda baja $120.00',
  );
  await expect(page.getByRole('dialog')).toContainText('saldo a favor');
});

test('sharing by WhatsApp waits for a ten-digit phone', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Quesadilla/, '100');
  await page.goto('/operador/ventas/V-0001');
  await page.getByRole('button', { name: 'Compartir comprobante' }).click();
  const modal = page.getByRole('dialog', { name: 'Compartir V-0001' });
  const wa = modal.getByRole('button', { name: /Enviar por WhatsApp/ });
  await expect(wa).toBeDisabled();
  await modal.getByLabel('Teléfono del cliente').fill('55 1234 5678');
  await expect(wa).toBeEnabled();
});

test('a folio that is not in the turno says so and points back to the list', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/ventas/V-9999');
  await expect(page.getByText('Esta venta ya no existe')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver mis ventas' })).toHaveAttribute(
    'href',
    '/operador/ventas',
  );
});
