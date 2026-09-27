import { expect, test } from './test';
import { venderEfectivo } from './cobrar';

import { mintCode, pasarAcceso } from './acceso-flow';
import { asTenant, BIZ } from './sync-phone';

/**
 * DB3-CAJA-01 — one tab owns the register. Each tab used to open its own
 * in-memory copy of the same OPFS database, and the last one to save erased
 * the other's unsent sales. Now the second tab of the caja stops at DS-08's
 * notice and never opens the database; «Usar esta pestaña» takes the register
 * once the first tab closes. The proof it wrote nothing: two sales captured
 * offline in the first tab, after the second opened, are pushed by the second
 * tab once the first is gone — so its copy was read after both, never before.
 */

test.use({ storageState: { cookies: [], origins: [] } });

// The real door is heavy: WASM boot, the bootstrap apply, bcrypt verifies.
test.setTimeout(120_000);

test('a second tab of the caja waits instead of opening the register', async ({
  page,
  context,
}) => {
  const code = 'PESTANA2';
  await mintCode(code);
  await page.goto('/operador/caja');
  await pasarAcceso(page, code);
  const antes = await idsDeTickets();

  // The second tab: the notice, not the register.
  const otra = await context.newPage();
  await otra.goto('/operador/caja');
  const aviso = otra.getByTestId('otra-pestana');
  await expect(aviso).toContainText('La caja ya está abierta en otra pestaña.');
  await expect(aviso).toContainText('Para no perder ventas, usa una sola pestaña.');
  await expect(otra.getByRole('heading', { name: 'Cobrar', exact: true })).toHaveCount(0);

  // The first tab keeps selling, offline: the sales live only in its database.
  await context.setOffline(true);
  const taco = page.getByRole('button', { name: /Taco al pastor/ }).first();
  for (const efectivo of ['30', '50']) {
    await taco.click();
    await venderEfectivo(page, efectivo);
    await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
  }

  // «Usar esta pestaña» waits for the lock; closing the first tab hands it over.
  await otra.getByTestId('usar-esta-pestana').click();
  await expect(otra.getByRole('status').filter({ hasText: 'Esperando' })).toBeVisible();
  await page.close();
  await expect(otra.getByTestId('otra-pestana')).toHaveCount(0, { timeout: 30_000 });

  // Back online, the second tab sends both sales: its database has them.
  await context.setOffline(false);
  await expect
    .poll(async () => (await idsDeTickets()).filter((id) => !antes.includes(id)).length, {
      timeout: 30_000,
    })
    .toBe(2);
});

/** Every ticket the business has, by id. */
function idsDeTickets(): Promise<string[]> {
  return asTenant(BIZ, async (sql) => {
    const rows = await sql<{ id: string }[]>`SELECT id FROM tickets`;
    return rows.map((r) => r.id);
  });
}
