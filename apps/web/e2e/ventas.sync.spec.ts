import { expect, test, type Page } from './test';
import { venderEfectivo } from './cobrar';

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
  await venderEfectivo(page, efectivo);
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

  // A wrong NIP is refused (the use case verifies it on the device); the dialog stays.
  await fila2.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar venta' }).click();
  const modal = page.getByRole('alertdialog');
  await modal.getByRole('radio', { name: 'El cliente se arrepintió' }).click();
  await modal.getByTestId('cancelar-nip').fill('9999');
  await modal.getByRole('button', { name: 'Cancelar venta' }).click();
  await expect(modal.getByText(/No se pudo cancelar/)).toBeVisible();

  // The right NIP cancels: the ticket stays, marked, with the cash to return.
  await modal.getByTestId('cancelar-nip').fill('2580');
  await modal.getByRole('button', { name: 'Cancelar venta' }).click();
  const cajon = page.getByRole('dialog');
  await expect(
    cajon.getByText(/V-0002 cancelada · El cliente se arrepintió\. Devuelve \$25\.00\./),
  ).toBeVisible();
  await cajon.getByRole('button', { name: 'Listo' }).click();
  await expect(fila2).toContainText('Cancelada');

  // The queue carries it up: the audit log and the marked ticket in Postgres.
  await expect
    .poll(
      async () =>
        asTenant(BIZ, async (sql) => {
          // The register numbers its own tickets from 1, and the seeded ledger
          // has folios of its own — including a 2, cancelled elsewhere in the
          // run («Cobré de más»). So: the newest cancellation of a folio 2,
          // which is the one this test just made.
          const [row] = await sql<{ motivo: string; cancelado: string }[]>`
            SELECT cl.motivo, t.cancelled_at::text AS cancelado
            FROM cancelacion_logs cl JOIN tickets t ON t.id = cl.ticket_id
            WHERE t.business_id = ${BIZ} AND t.folio = 2
            ORDER BY cl.created_at DESC LIMIT 1`;
          return row?.motivo ?? '';
        }),
      { timeout: 15_000 },
    )
    .toBe('El cliente se arrepintió');
});
