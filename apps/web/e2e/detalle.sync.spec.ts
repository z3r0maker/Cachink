import { expect, test } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await cobro.getByLabel('Con cuánto paga').fill('60');
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  // From the list, into the ticket.
  await page.getByRole('link', { name: 'Ventas' }).click();
  await page.getByTitle('Ver el ticket').first().click();
  await expect(page.getByText('Venta V-0001')).toBeVisible();

  // The ticket as the register stored it: lines, cash, change, who captured it.
  await expect(page.getByText('Taco al pastor')).toBeVisible();
  await expect(page.getByText('$25.00 cada uno')).toBeVisible();
  await expect(page.getByText('Recibido en efectivo')).toBeVisible();
  await expect(page.getByText('$60.00').first()).toBeVisible();
  await expect(page.getByText('Cambio que se entregó')).toBeVisible();
  await expect(page.getByText('$10.00').first()).toBeVisible();
  await expect(page.getByRole('main').getByText('Ana Robledo')).toBeVisible();
  await expect(page.getByText('Venta registrada y enviada')).toBeVisible();

  // The comprobante carries the real ticket.
  await page.getByRole('button', { name: 'Compartir comprobante' }).click();
  await expect(page.getByRole('dialog', { name: 'Compartir V-0001' })).toBeVisible();
  await page.keyboard.press('Escape');

  // Cancelling asks for the NIP (the domain's rule) and marks the ticket.
  await page.getByRole('button', { name: 'Cancelar venta' }).click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: 'Cobro duplicado' }).click();
  await modal.getByTestId('cancelar-nip').fill('2580');
  await modal.getByRole('button', { name: 'Cancelar la venta' }).click();
  await expect(page.getByText('Venta cancelada')).toBeVisible();
  await expect(page.getByText('Cobro duplicado')).toBeVisible();

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
    .toBe('Cobro duplicado');
});
