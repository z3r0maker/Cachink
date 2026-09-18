import { expect, test } from '@playwright/test';
import postgres from 'postgres';

/**
 * The portal's first write, end to end.
 *
 * Browser → server action → tenant transaction → `EditarProductoUseCase` (the
 * same use case the phone runs) → RLS `WITH CHECK` → `products` row →
 * `sync_log` append → revalidate → the new value back in the table.
 *
 * The `sync_log` assertion is the half that is easy to forget and impossible to
 * see in the UI. `products` is a HYBRID table: a device creates the row, the
 * portal corrects it, and the correction only reaches the phone because a row
 * lands in `sync_log` for the puller to find (contract §5, §8). A write that
 * updated the table and skipped the log would look perfect on screen and
 * silently never reach the device.
 *
 * Desktop only: it mutates a shared row, and the three viewport projects run
 * concurrently against one database.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

async function syncLogCount(): Promise<number> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    const [row] = await sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM sync_log WHERE table_name = 'products'`;
    return Number(row?.n ?? 0);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

test('editing a product saves it and tells the devices', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');

  const before = await syncLogCount();
  const renamed = `Taco al pastor ${Date.now()}`;

  await page.goto('/productos');
  const row = page.locator('main').locator('tr', { hasText: 'TAC-001' });
  await row.getByRole('button', { name: 'Editar' }).click();

  const field = page.getByTestId('edit-producto-nombre');
  await field.fill(renamed);
  await page.getByRole('button', { name: 'Guardar' }).click();

  // The table re-renders from the server, so seeing the new name proves the row
  // was actually read back out of Postgres — not that React kept local state.
  await expect(page.locator('main').getByText(renamed)).toBeVisible();

  const after = await syncLogCount();
  expect(after, 'the edit must append exactly one sync_log row for the device to pull').toBe(
    before + 1,
  );
});

test('a rejected edit shows the reason instead of a blank dialog', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');

  await page.goto('/productos');
  const row = page.locator('main').locator('tr', { hasText: 'TAC-001' });
  await row.getByRole('button', { name: 'Editar' }).click();

  await page.getByTestId('edit-producto-nombre').fill('   ');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('Escribe un nombre.')).toBeVisible();
});
