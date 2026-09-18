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

async function syncLogCount(table = 'products'): Promise<number> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    const [row] = await sql<{ n: string }[]>`
      SELECT count(*)::text AS n FROM sync_log WHERE table_name = ${table}`;
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

  const field = page.getByTestId('producto-nombre');
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

  await page.getByTestId('producto-nombre').fill('   ');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.getByText('Escribe el nombre del producto.')).toBeVisible();
});

test('marking avisos read clears the bell, and says how many', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates shared rows');

  await page.goto('/avisos');
  await page.getByRole('button', { name: 'Marcar todo como leído' }).click();

  // It reports a count rather than going quiet: the badge it clears lives in
  // the header, so silence would read as nothing having happened.
  await expect(page.getByTestId('avisos-note')).toContainText(/\d+ aviso/);

  // The Asesor is deliberately untouched (ADR-060), so its feed still has its
  // row while the bell has emptied.
  await page.goto('/asesor');
  await expect(
    page.locator('main').getByText('El queso te cuesta 18% más que en junio'),
  ).toBeVisible();
});

test('editing the business writes it and tells the devices', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');

  const before = await syncLogCount('businesses');
  const renamed = `Taquería Don Pedro ${Date.now()}`;

  await page.goto('/negocio');
  await page.getByRole('button', { name: 'Editar negocio' }).click();
  await page.getByTestId('negocio-nombre').fill(renamed);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  // The shell reads the business name from the row, so seeing it in the header
  // proves the value came back out of Postgres.
  await expect(page.locator('header').getByText(renamed)).toBeVisible();
  expect(await syncLogCount('businesses')).toBe(before + 1);
});

test('adding an employee stores centavos, not pesos', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'inserts a shared row');

  const before = await syncLogCount('employees');
  const nombre = `Marta ${Date.now()}`;

  await page.goto('/empleados');
  await page.getByRole('button', { name: 'Nuevo empleado' }).click();
  await page.getByTestId('empleado-nombre').fill(nombre);
  await page.getByTestId('empleado-puesto').fill('Mesera');
  await page.getByTestId('empleado-salario').fill('1875.50');
  await page.getByRole('button', { name: 'Guardar' }).click();

  await expect(page.locator('main').getByText(nombre)).toBeVisible();

  // The column is integer centavos (CLAUDE.md §2.8). Asserting the stored
  // value, not the rendered one, is what catches a float slipping through: a
  // screen formatting 1875.5 pesos looks identical either way.
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    const [row] = await sql<{ salario_centavos: string }[]>`
      SELECT salario_centavos::text FROM employees WHERE nombre = ${nombre}`;
    expect(row?.salario_centavos).toBe('187550');
  } finally {
    await sql.end({ timeout: 5 });
  }

  expect(await syncLogCount('employees')).toBe(before + 1);
});
