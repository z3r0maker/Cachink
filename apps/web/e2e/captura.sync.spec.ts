import { expect, test } from '@playwright/test';

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

test('an offline sale lands exactly once when the wire comes back', async ({ page, context }) => {
  const code = 'CAPTURA7';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  // The linked register sells its own catalogue: the seeded Taco al pastor.
  await expect(page.getByRole('button', { name: /Taco al pastor/ })).toBeVisible();
  const antes = await cuentaTickets();

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
    const [ticket] = await sql<{ id: string; folio: number }[]>`
      SELECT id, folio FROM tickets WHERE business_id = ${BIZ} ORDER BY created_at DESC LIMIT 1`;
    const [linea] = await sql<{ monto_centavos: string; concepto: string }[]>`
      SELECT monto_centavos::text AS monto_centavos, concepto FROM sales
      WHERE ticket_id = ${ticket?.id ?? ''}`;
    return { ticket, linea };
  });
  expect(fila.ticket?.folio).toBe(1);
  expect(fila.linea?.monto_centavos).toBe('2500');
  expect(fila.linea?.concepto).toContain('Taco al pastor');
});

/** The business's tickets (the seed ships six; the count watches for new ones). */
function cuentaTickets(): Promise<number> {
  return asTenant(BIZ, async (sql) => {
    const [row] = await sql<{ n: string }[]>`SELECT count(*)::text AS n FROM tickets`;
    return Number(row?.n ?? 0);
  });
}
