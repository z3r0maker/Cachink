import { expect, test } from './test';
import { venderEfectivo } from './cobrar';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-34 — Operador · Detalle de venta on the register's own data: the folio of
 * the list opens the real ticket — lines, cash and change, who captured it —
 * the comprobante shares it, and cancelling goes through the use case with the
 * operator's NIP, the audit log reaching Postgres.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(90_000);

test("the turno's folio opens the real ticket, shares it, and cancels it", async ({ page }) => {
  const code = 'DTVTA9A2';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  // Two tacos in cash ($50, paid with 60).
  const taco = page.getByRole('button', { name: /Taco al pastor/ }).first();
  await taco.click();
  await taco.click();
  await venderEfectivo(page, '60');
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  // From the list, into the ticket.
  await page.getByRole('link', { name: 'Ventas' }).click();
  await page.getByRole('button', { name: /^Ver venta V-0001/ }).click();
  const cajon = page.getByRole('dialog');
  await expect(cajon.getByText('Venta · V-0001')).toBeVisible();

  // The ticket as the register stored it: lines, cash, change, who captured it.
  await expect(cajon.getByText('Taco al pastor')).toBeVisible();
  await expect(cajon.getByText('2 × $25.00')).toBeVisible();
  await expect(cajon.getByText('Recibiste')).toBeVisible();
  await expect(cajon.getByText('$60.00').first()).toBeVisible();
  await expect(cajon.getByText('Cambio que diste')).toBeVisible();
  await expect(cajon.getByText('$10.00').first()).toBeVisible();
  await expect(cajon.getByText('Ana Robledo')).toBeVisible();
  await expect(cajon.getByText('Enviada', { exact: true })).toBeVisible();

  // The comprobante carries the real ticket — and its image is the branded
  // N-20 render: the register is linked and online, so «Guardar imagen»
  // fetches /api/v1/comprobante and downloads the business's template.
  await cajon.getByRole('button', { name: 'Mandar comprobante' }).click();
  const dialogo = page.getByRole('dialog', { name: 'Mandar comprobante · V-0001' });
  await expect(dialogo).toBeVisible();
  const descarga = page.waitForEvent('download');
  await dialogo.getByRole('button', { name: 'Guardar imagen' }).click();
  const imagen = await descarga;
  expect(imagen.suggestedFilename()).toBe('comprobante-V-0001.png');
  await page.keyboard.press('Escape');

  // Cancelling asks for the NIP (the domain's rule) and marks the ticket.
  // Esc closed the comprobante back to the side panel.
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar venta' }).click();
  const modal = page.getByRole('alertdialog');
  await modal.getByRole('radio', { name: 'Me equivoqué al cobrar' }).click();
  await modal.getByTestId('cancelar-nip').fill('2580');
  await modal.getByRole('button', { name: 'Cancelar venta' }).click();
  await expect(page.getByRole('dialog').getByText('Cancelada', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('dialog').getByText('Me equivoqué al cobrar', { exact: true }),
  ).toBeVisible();

  // The queue carries it up: the audit log and the marked ticket in Postgres.
  await expect
    .poll(
      async () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ motivo: string }[]>`
            SELECT cl.motivo FROM cancelacion_logs cl
            JOIN tickets t ON t.id = cl.ticket_id
            WHERE t.business_id = ${BIZ} AND t.folio = 1 AND t.cancelled_at IS NOT NULL
            ORDER BY cl.created_at DESC LIMIT 1`;
          return row?.motivo ?? '';
        }),
      { timeout: 15_000 },
    )
    .toBe('Me equivoqué al cobrar');
});
