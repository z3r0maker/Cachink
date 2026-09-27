import { expect, test, type Page } from './test';
import { venderEfectivo as pagarEfectivo, venderFiado } from './cobrar';

import { puertaOperador } from './puerta-operador';

test.beforeEach(() => test.setTimeout(120_000));

/** Sell two of a product in cash; returns nothing (the folio is V-0001). */
async function venderEfectivo(page: Page, producto: RegExp, efectivo: string): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
  await pagarEfectivo(page, efectivo);
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

/** Fiado sale on the client's account. */
async function fiar(page: Page, producto: RegExp, cliente: RegExp): Promise<void> {
  await page.getByRole('button', { name: producto }).first().click();
  await page.getByRole('button', { name: producto }).first().click();
  await venderFiado(page, cliente);
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
  // The row opens the ticket in a side panel over the list (OpVentas).
  await page.getByRole('button', { name: /^Ver venta V-0001/ }).click();
  const cajon = page.getByRole('dialog');
  await expect(cajon.getByText('Venta · V-0001')).toBeVisible();
  await expect(cajon.getByText('Quesadilla')).toBeVisible();
  await expect(cajon.getByText('Recibiste')).toBeVisible();
  await expect(cajon.getByText('$20.00')).toBeVisible();
  await expect(cajon.getByText('Enviada', { exact: true })).toBeVisible();
});

test('cancelling needs the NIP and a reason, and never deletes it', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Quesadilla/, '100');
  // The folio's route opens the list with that ticket's side panel.
  await page.goto('/operador/ventas/V-0001');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar venta' }).click();
  const modal = page.getByRole('alertdialog', { name: '¿Cancelar la venta V-0001?' });
  await expect(modal.getByRole('button', { name: 'Cancelar venta' })).toBeDisabled();
  await modal.getByRole('radio', { name: 'Me equivoqué al cobrar' }).click();
  await modal.getByTestId('cancelar-nip').fill('2580');
  await modal.getByRole('button', { name: 'Cancelar venta' }).click();

  const cajon = page.getByRole('dialog');
  await expect(cajon.getByText('Cancelada', { exact: true })).toBeVisible();
  await expect(cajon.getByText('Me equivoqué al cobrar', { exact: true })).toBeVisible();
  await expect(cajon.getByRole('button', { name: 'Cancelar venta' })).toHaveCount(0);
  await expect(cajon.getByRole('button', { name: 'Listo' })).toBeVisible();
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
  const cajon = page.getByRole('dialog');
  await expect(cajon).toContainText('Esta venta se fue a la cuenta de Doña Mari de la tienda');
  await expect(cajon.getByRole('link', { name: 'Recibir un abono' })).toHaveAttribute(
    'href',
    '/operador/cobranza',
  );
  await cajon.getByRole('button', { name: 'Cancelar venta' }).click();
  await expect(page.getByRole('alertdialog')).toContainText(
    'el saldo de Doña Mari de la tienda baja $120.00',
  );
  await expect(page.getByRole('alertdialog')).toContainText('saldo a favor');
});

test('sharing by WhatsApp takes no number or a whole ten-digit one', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/caja');
  await venderEfectivo(page, /Quesadilla/, '100');
  await page.goto('/operador/ventas/V-0001');
  await page.getByRole('dialog').getByRole('button', { name: 'Mandar comprobante' }).click();
  const modal = page.getByRole('dialog', { name: 'Mandar comprobante · V-0001' });
  const wa = modal.getByRole('button', { name: /Enviar por WhatsApp/ });
  // Empty: WhatsApp opens and asks for the contact.
  await expect(wa).toBeEnabled();
  await modal.getByLabel(/Número del cliente/).fill('55 12');
  await expect(wa).toBeDisabled();
  await modal.getByLabel(/Número del cliente/).fill('55 1234 5678');
  await expect(wa).toBeEnabled();
});

test('a folio that is not in the turno says so and points back to the list', async ({ page }) => {
  await puertaOperador(page);
  await page.goto('/operador/ventas/V-9999');
  await expect(page.getByRole('dialog').getByText('Esta venta ya no existe')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver mis ventas' })).toHaveAttribute(
    'href',
    '/operador/ventas',
  );
});
