import { expect, test } from './test';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * O-13 — the register locks and two operators alternate without losing the
 * ticket in progress: Ana links and opens, the ticket holds two lines, the
 * caja locks, Luis comes in with his NIP, and the ticket survives — the sale
 * that follows is Luis's (the use case stamps the session's operator).
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(90_000);

test('two operators alternate on one register without losing the ticket', async ({ page }) => {
  const code = 'BLQCAJA2';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  // Two lines on the ticket.
  const taco = page.getByRole('button', { name: /Taco al pastor/ }).first();
  await taco.click();
  await taco.click();

  // Lock the caja: the note spells the ticket and whose turno it is.
  await page.getByRole('button', { name: 'Bloquear caja' }).click();
  const dialog = page.getByTestId('caja-bloqueada');
  await expect(dialog).toBeVisible();
  await expect(page.getByTestId('bloqueo-nota')).toContainText(
    'El ticket de Ana queda guardado con 2 artículos',
  );

  // A wrong NIP is refused; Luis's opens it as him.
  const luis = page.getByTestId('bloqueo-operador').filter({ hasText: 'Luis Ortega' });
  await luis.click();
  for (const k of '9999') await page.getByTestId(`bloqueo-tecla-${k}`).click();
  await page.getByTestId('bloqueo-entrar').click();
  await expect(page.getByTestId('bloqueo-error')).toBeVisible();

  for (const k of '2580') await page.getByTestId(`bloqueo-tecla-${k}`).click();
  await page.getByTestId('bloqueo-entrar').click();
  await expect(dialog).not.toBeVisible();

  // The ticket survived the switch: still two of the same product.
  await expect(page.getByRole('complementary', { name: 'Ticket' })).toContainText('Taco al pastor');
  const unidades = await page
    .getByRole('complementary', { name: 'Ticket' })
    .getByRole('button', { name: 'Agregar uno' })
    .count();
  expect(unidades).toBe(1);

  // Sell it; the sale that reaches Postgres is Luis's.
  await page.getByRole('button', { name: 'Cobrar', exact: true }).first().click();
  const cobro = page.getByRole('dialog');
  await cobro.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await cobro.getByLabel('Con cuánto paga').fill('60');
  await cobro.getByRole('button', { name: 'Registrar venta' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);

  // The queue pushes asynchronously; poll until Luis's ticket lands.
  await expect
    .poll(
      async () => {
        const r = await asTenant(BIZ, async (sql) => {
          const [row] = await sql<{ user_id: string }[]>`
            SELECT u.id AS user_id FROM tickets t
            JOIN users u ON u.id = t.created_by_user_id
            WHERE t.business_id = ${BIZ} ORDER BY t.created_at DESC LIMIT 1`;
          const [luisRow] = await sql<{ id: string }[]>`
            SELECT id FROM users WHERE nombre = 'Luis Ortega' AND business_id = ${BIZ}`;
          return row?.user_id !== undefined && row.user_id === luisRow?.id;
        });
        return r ? 'luis' : 'pending';
      },
      { timeout: 15_000 },
    )
    .toBe('luis');
});
