import { expect, test } from '@playwright/test';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-33 — Operador · Cobranza on the register's own data: a fiado sale carries
 * its client (the picker reads the register's database), the account shows
 * balance and history from the register's tickets, an abono goes through the
 * real use case — oldest first, whole, the queue carrying it up — and both the
 * ticket and the payment reach Postgres.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(90_000);

const CLIENTE = 'Doña Mari de la tienda';

// The register stamps its dates on the UTC clock, so after 18:00 in Mexico
// City its "today" is already tomorrow — a hardcoded «27 de septiembre»
// failed evenings only (found 2026-09-20). Expect what the app computes.
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;
function venceMasSiete(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return `Vence el ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
}

test('a fiado sale opens an account, and an abono settles it oldest first', async ({ page }) => {
  const code = 'CBRANZA2';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  // A fiado ticket: two tacos on Doña Mari's account.
  const taco = page.getByRole('button', { name: /Taco al pastor/ }).first();
  await taco.click();
  await taco.click();
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Fiado', exact: true }).click();
  await cobro.getByRole('button', { name: CLIENTE }).click();
  await cobro.getByRole('button', { name: 'Registrar fiado' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  // Cobranza reads the register's database: the cards and the figures.
  await page.getByRole('link', { name: 'Cobranza' }).click();
  await expect(page.getByRole('heading', { name: 'Cobranza' })).toBeVisible();
  await expect(page.getByText('$50.00').first()).toBeVisible();
  await expect(page.getByText('1 ventas abiertas · la más antigua V-0001').first()).toBeVisible();

  // The abono: $20 in cash, applied to the oldest (only) ticket.
  await page.getByRole('button', { name: 'Recibir abono' }).click();
  const abono = page.getByRole('dialog');
  await abono.getByLabel('Cuánto abona').fill('20');
  await abono.getByRole('button', { name: 'Registrar abono' }).click();
  await expect(page.getByRole('status')).toContainText(
    '$20.00 de Doña Mari de la tienda por efectivo. Se aplicó a lo más antiguo; queda $30.00.',
  );
  await expect(page.getByText('$30.00').first()).toBeVisible();

  // The account's history: the open ticket and today's abono.
  await page.locator('a[href="/operador/cobranza/01HZ8XQN9GZJXV8AKQ5X0CDMAR"]').click();
  await expect(page.getByText('Ya abonó $20.00')).toBeVisible();
  await expect(page.getByText(venceMasSiete())).toBeVisible();
  await expect(page.getByText('Venta fiada V-0001')).toBeVisible();

  // The queue carries it up: the fiado ticket pendiente, the abono recorded.
  await expect
    .poll(
      async () =>
        asTenant(BIZ, async (sql) => {
          const [pago] = await sql<{ monto: string }[]>`
            SELECT monto_centavos::text AS monto FROM client_payments
            WHERE business_id = ${BIZ} ORDER BY created_at DESC LIMIT 1`;
          const [ticket] = await sql<{ estado: string; cliente: string }[]>`
            SELECT estado_pago AS estado, cliente_id AS cliente FROM tickets
            WHERE business_id = ${BIZ} AND folio = 1
            ORDER BY created_at DESC LIMIT 1`;
          return `${pago?.monto ?? '-'}|${ticket?.estado ?? '-'}|${ticket?.cliente ?? '-'}`;
        }),
      { timeout: 15_000 },
    )
    .toBe('2000|pendiente|01HZ8XQN9GZJXV8AKQ5X0CDMAR');
});
