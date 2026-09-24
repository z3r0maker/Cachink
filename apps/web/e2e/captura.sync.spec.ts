import { expect, test } from './test';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-06's acceptance: a sale captured offline is pushed on reconnect exactly
 * once. The register walks the real door (link → NIP → fondo), sells a real
 * product from its own database with the wire cut, and the reconnect flushes
 * one ticket — verified in Postgres by row count and folio. A second flush of
 * the same row is idempotent server-side, so exactly-once is the count.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(90_000);

test('an offline sale lands exactly once when the wire comes back', async ({ page, context }) => {
  const code = 'CAPTURA7';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  // The linked register sells its own catalogue: the seeded Taco al pastor.
  await expect(page.getByRole('button', { name: /Taco al pastor/ })).toBeVisible();
  const idsAntes = await idsDeTickets();
  const antes = idsAntes.length;

  // Cut the wire, then capture: the sale must still complete.
  await context.setOffline(true);
  await page
    .getByRole('button', { name: /Taco al pastor/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const modal = page.getByRole('dialog');
  await modal.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await modal.getByLabel('Con cuánto paga').fill('30');
  await modal.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  // Nothing reached Postgres while offline.
  expect(await cuentaTickets()).toBe(antes);

  // Reconnect: the queue flushes, and the sale is in Postgres exactly once.
  await context.setOffline(false);
  await expect.poll(async () => cuentaTickets(), { timeout: 15_000 }).toBe(antes + 1);

  const fila = await asTenant(BIZ, async (sql) => {
    // The pushed row by *identity*, not by «newest». The register stamps it with
    // the device's clock, which this suite pins to the seed's day, so the
    // seeded ledger — written at the real now() — is newer by `created_at` and
    // this used to read a seeded ticket and report its folio (2086).
    const [ticket] = await sql<{ id: string; folio: number }[]>`
      SELECT id, folio FROM tickets
      WHERE business_id = ${BIZ} AND id <> ALL(${idsAntes})`;
    const [linea] = await sql<{ monto_centavos: string; concepto: string }[]>`
      SELECT monto_centavos::text AS monto_centavos, concepto FROM sales
      WHERE ticket_id = ${ticket?.id ?? ''}`;
    return { ticket, linea };
  });
  expect(fila.ticket?.folio).toBe(1);
  expect(fila.linea?.monto_centavos).toBe('2500');
  expect(fila.linea?.concepto).toContain('Taco al pastor');
});

/** Every ticket the business has: the count watches for new ones, the ids name them. */
function idsDeTickets(): Promise<string[]> {
  return asTenant(BIZ, async (sql) => {
    const rows = await sql<{ id: string }[]>`SELECT id FROM tickets`;
    return rows.map((r) => r.id);
  });
}

const cuentaTickets = async (): Promise<number> => (await idsDeTickets()).length;
