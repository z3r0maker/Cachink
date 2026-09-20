import { expect, test, type Page } from '@playwright/test';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-32 — Operador · Ventas on the register's own data: the turno's tickets
 * straight from its database (folios, methods, the KPIs from real lines), and
 * a cancellation through the real use case — wrong NIP refused, the right one
 * cancels, the audit log and the marked ticket reach Postgres.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(90_000);

/** One Taco al pastor sold in cash, exactly as the register captures it. */
async function venderTaco(page: Page, efectivo: string): Promise<void> {
  await page
    .getByRole('button', { name: /Taco al pastor/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await cobro.getByLabel('Con cuánto paga').fill(efectivo);
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
}

test("the turno's real tickets, and a cancellation that asks for the NIP", async ({ page }) => {
  const code = 'VENTAS32';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  // Two tickets: one of two tacos ($50 paid with 60), one of a single ($25).
  await page
    .getByRole('button', { name: /Taco al pastor/ })
    .first()
    .click();
  await venderTaco(page, '60');
  await venderTaco(page, '30');

  await page.getByRole('link', { name: 'Ventas' }).click();
  await expect(page.getByRole('heading', { name: 'Ventas' })).toBeVisible();

  // The list reads the register's database: both folios, the KPIs from lines.
  const fila1 = page.getByText('V-0001', { exact: true }).locator('..');
  const fila2 = page.getByText('V-0002', { exact: true }).locator('..');
  await expect(fila1).toContainText('Taco al pastor');
  await expect(fila1).toContainText('$50.00');
  await expect(fila2).toContainText('$25.00');
  await expect(page.getByText('$75.00').first()).toBeVisible();

  // A wrong NIP is refused — the use case verifies it on the device.
  await fila2.getByTitle('Cancelar venta').click();
  await page.getByRole('button', { name: 'Error de captura' }).click();
  await page.getByTestId('cancelar-nip').fill('9999');
  await page.getByRole('button', { name: 'Cancelar la venta' }).click();
  await expect(page.getByText(/No se pudo cancelar/)).toBeVisible();

  // The right NIP cancels: the ticket stays, marked, with the cash to return.
  await fila2.getByTitle('Cancelar venta').click();
  await page.getByRole('button', { name: 'Error de captura' }).click();
  await page.getByTestId('cancelar-nip').fill('2580');
  await page.getByRole('button', { name: 'Cancelar la venta' }).click();
  await expect(
    page.getByText(/V-0002 cancelada · Error de captura\. Devuelve \$25\.00\./),
  ).toBeVisible();
  await expect(fila2).toContainText('Cancelada · Error de captura');

  // The queue carries it up: the audit log and the marked ticket in Postgres.
  await expect
    .poll(
      async () =>
        asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ motivo: string; cancelado: string }[]>`
            SELECT cl.motivo, t.cancelled_at::text AS cancelado
            FROM cancelacion_logs cl JOIN tickets t ON t.id = cl.ticket_id
            WHERE t.business_id = ${BIZ} AND t.folio = 2`;
          return row?.motivo ?? '';
        }),
      { timeout: 15_000 },
    )
    .toBe('Error de captura');
});
