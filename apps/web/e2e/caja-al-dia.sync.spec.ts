import { expect, test } from './test';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * DB3-CAJA-03 — an idle caja pulls. It used to pull only after a sale, so an
 * operator the owner deactivated kept a working NIP on a caja nobody sold on
 * (NIPs are checked on the device). Now it also pulls on boot, back in view
 * and every 5 min: here the owner deactivates Luis, the caja reloads without
 * selling, and Luis is gone from the lock screen's picker.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(120_000);

const LUIS = 'Luis Ortega';

/** The portal's deactivation, as `recordChange` does it: the row and its `sync_log` entry. */
async function ponerActivo(activo: boolean): Promise<void> {
  await asTenant(BIZ, async (sql) => {
    const [u] = await sql<{ id: string }[]>`
      UPDATE users SET active = ${activo}, updated_at = now()
      WHERE business_id = ${BIZ} AND nombre = ${LUIS} RETURNING id`;
    if (u === undefined) throw new Error(`${LUIS} is not seeded`);
    await sql`
      WITH c AS (UPDATE sync_cursors SET last_seq = last_seq + 1 RETURNING last_seq)
      INSERT INTO sync_log (seq, table_name, row_id, op, business_id, created_at, updated_at)
      SELECT c.last_seq, 'users', ${u.id}, 'update', ${BIZ}, now(), now() FROM c`;
  });
}

test.afterEach(async () => {
  await ponerActivo(true);
});

test('a deactivated operator leaves an idle caja without a sale', async ({ page }) => {
  const code = 'REFRESC4';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);

  await ponerActivo(false);

  // No sale: the caja only reloads, and pulls on boot.
  const pull = page.waitForResponse((r) => r.url().includes('/sync/pull') && r.ok(), {
    timeout: 30_000,
  });
  await page.reload();
  await pull;
  // The Worker applies the page it just received; give it a moment to land.
  await page.waitForTimeout(1_000);

  await page.getByRole('button', { name: 'Bloquear caja' }).click();
  const dialog = page.getByTestId('caja-bloqueada');
  await dialog.getByRole('button', { name: 'No soy Ana, cambiar de persona' }).click();
  await expect(page.getByTestId('bloqueo-operador').filter({ hasText: 'Ana Robledo' })).toHaveCount(
    1,
  );
  await expect(page.getByTestId('bloqueo-operador').filter({ hasText: LUIS })).toHaveCount(0);
});
