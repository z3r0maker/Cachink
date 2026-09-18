import { expect, test } from '@playwright/test';

/**
 * O-22 (Track O, fase 12): Operador · Detalle de venta. The full ticket with
 * cash and change; cancelling needs a reason and leaves it visible; a fiado
 * sale shows its client; a folio that is gone says so.
 */
test('a ticket from the list shows its lines, cash received and change', async ({ page }) => {
  await page.goto('/operador/ventas');
  await page.getByTitle('Ver el ticket').first().click();
  await expect(page).toHaveURL(/\/operador\/ventas\/V-0412$/);
  await expect(page.getByText('Venta V-0412')).toBeVisible();
  await expect(page.getByText('Taco de pastor')).toBeVisible();
  await expect(page.getByText('Recibido en efectivo')).toBeVisible();
  await expect(page.getByText('$40.00')).toBeVisible();
  await expect(page.getByText('Venta registrada y enviada')).toBeVisible();
});

test('cancelling needs a reason and marks the ticket, never deletes it', async ({ page }) => {
  await page.goto('/operador/ventas/V-0412');
  await page.getByRole('button', { name: 'Cancelar venta' }).click();
  const modal = page.getByRole('dialog', { name: 'Cancelar V-0412' });
  await expect(modal.getByRole('button', { name: 'Cancelar la venta' })).toBeDisabled();
  await modal.getByRole('button', { name: 'Producto equivocado' }).click();
  await modal.getByRole('button', { name: 'Cancelar la venta' }).click();

  await expect(page.getByText('Venta cancelada')).toBeVisible();
  await expect(page.getByText('Producto equivocado')).toBeVisible();
  await expect(page.getByText('Sí, con su cancelación')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancelar venta' })).toBeDisabled();
});

test('a fiado ticket shows the client, and cancelling explains the saldo a favor', async ({
  page,
}) => {
  await page.goto('/operador/ventas/V-0409');
  await expect(page.getByText('Esta venta quedó fiada')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Recibir un abono' })).toHaveAttribute(
    'href',
    '/operador/cobranza',
  );
  await page.getByRole('button', { name: 'Cancelar venta' }).click();
  await expect(page.getByRole('dialog')).toContainText(
    'el saldo de Doña Mari de la tienda baja $90.00',
  );
  await expect(page.getByRole('dialog')).toContainText('saldo a favor');
});

test('sharing by WhatsApp waits for a ten-digit phone', async ({ page }) => {
  await page.goto('/operador/ventas/V-0412');
  await page.getByRole('button', { name: 'Compartir comprobante' }).click();
  const modal = page.getByRole('dialog', { name: 'Compartir V-0412' });
  const wa = modal.getByRole('button', { name: /Enviar por WhatsApp/ });
  await expect(wa).toBeDisabled();
  await modal.getByLabel('Teléfono del cliente').fill('55 1234 5678');
  await expect(wa).toBeEnabled();
});

test('a folio that is not in the turno says so and points back to the list', async ({ page }) => {
  await page.goto('/operador/ventas/V-9999');
  await expect(page.getByText('Esta venta ya no existe')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver mis ventas' })).toHaveAttribute(
    'href',
    '/operador/ventas',
  );
});
