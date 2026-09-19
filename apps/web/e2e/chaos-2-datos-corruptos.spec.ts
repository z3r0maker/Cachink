import { expect, test, type Page } from '@playwright/test';
import postgres from 'postgres';

/**
 * Chaos category 2 — corrupted / injection data paths.
 *
 * The portal's only length gates are server-side (Zod `nombre ≤120`, `sku ≤64`,
 * src/entities/product.ts). There is no client `maxLength`, so the browser is
 * assumed safe by React escaping and parameterized SQL. These tests are the
 * proof: they assert an error surface renders OR the payload is stored verbatim
 * and rendered inert, never executed.
 *
 * `fullyParallel` runs against one Postgres, so each mutating test owns a
 * distinct seeded product (TAC-002 … TAC-006) to avoid cross-test writes.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

async function query<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** Open the edit drawer for one seeded row by SKU. */
async function openEditor(page: Page, sku: string): Promise<void> {
  await page.goto('/productos');
  await page
    .locator('main')
    .locator('tr', { hasText: sku })
    .getByRole('button', { name: 'Editar' })
    .click();
  await expect(page.getByTestId('producto-nombre')).toBeVisible();
}

/** Fail the test the instant any JS dialog (alert/confirm/prompt) fires. */
function failOnJsDialog(page: Page): { fired: () => boolean } {
  let fired = false;
  page.on('dialog', () => {
    fired = true;
  });
  return { fired: () => fired };
}

test('script tag in a product name is stored verbatim and rendered as text', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');
  const dialogs = failOnJsDialog(page);

  const payload = `<script>alert('cachink')</script>`;
  await openEditor(page, 'TAC-002');
  await page.getByTestId('producto-nombre').fill(payload);
  await page.getByRole('button', { name: 'Guardar' }).click();

  // Recovery state: the drawer closed (server accepted) and the payload is
  // visible as literal text — escaping held, nothing executed.
  await expect(page.getByTestId('producto-error')).toHaveCount(0);
  await expect(page.locator('main').getByText(payload, { exact: true })).toBeVisible();
  expect(dialogs.fired(), 'no alert()/confirm() may ever fire from stored data').toBe(false);

  const [row] = await query(
    async (sql) => sql<{ nombre: string }[]>`SELECT nombre FROM products WHERE sku = 'TAC-002'`,
  );
  expect(row?.nombre).toBe(payload);
});

test('a 10,000-character name is refused by the server, row untouched', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');

  const readName = () =>
    query(async (sql) => {
      const [row] = await sql<
        { nombre: string }[]
      >`SELECT nombre FROM products WHERE sku = 'TAC-004'`;
      return row?.nombre ?? '';
    });
  const before = await readName();

  await openEditor(page, 'TAC-004');
  await page.getByTestId('producto-nombre').fill('A'.repeat(10_000));
  await page.getByRole('button', { name: 'Guardar' }).click();

  // Recovery state: the alert container renders (server Zod max 120) with a
  // non-empty message, the drawer stays open with the draft, and Postgres is untouched.
  const error = page.getByTestId('producto-error');
  await expect(error).toBeVisible();
  await expect(error).not.toBeEmpty();
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible();
  expect(await readName()).toBe(before);
});

test('SQL fragments in name and SKU are inert end to end', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');
  const dialogs = failOnJsDialog(page);

  const nombre = `🌮 peor caso'); DROP TABLE products; --`;
  const sku = `x'; DELETE FROM products WHERE '1'='1`;
  await openEditor(page, 'TAC-005');
  await page.getByTestId('producto-nombre').fill(nombre);
  await page.getByTestId('producto-sku').fill(sku);
  await page.getByRole('button', { name: 'Guardar' }).click();

  // Recovery state: the payload renders as text and the parameterized query held.
  await expect(page.locator('main').getByText(nombre, { exact: true })).toBeVisible();
  expect(dialogs.fired()).toBe(false);

  const state = await query(async (sql) => {
    const [count] = await sql<{ n: string }[]>`SELECT count(*)::text AS n FROM products`;
    const [row] = await sql<
      { nombre: string; sku: string | null }[]
    >`SELECT nombre, sku FROM products WHERE sku = ${sku}`;
    return { count: Number(count?.n ?? 0), row };
  });
  expect(state.count, 'products table must survive the injection attempt').toBe(6);
  expect(state.row?.nombre).toBe(nombre);
});

test('movimiento cantidad launders exponents/hex through Number()', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');

  await page.goto('/productos');
  await page
    .locator('main')
    .locator('tr', { hasText: 'TAC-006' })
    .getByRole('button', { name: 'Movimiento' })
    .click();
  const dialog = page.getByRole('dialog');

  // "abc" and ".5" must produce the literal inline validation messages.
  await dialog.getByTestId('movimiento-cantidad').fill('abc');
  await dialog.getByTestId('movimiento-costo').fill('12.50');
  await dialog.getByRole('button', { name: /^Registrar$/ }).click();
  await expect(dialog.getByText('La cantidad es un número entero mayor que 0.')).toBeVisible();

  await dialog.getByTestId('movimiento-cantidad').fill('2');
  await dialog.getByTestId('movimiento-costo').fill('.5');
  await dialog.getByRole('button', { name: /^Registrar$/ }).click();
  await expect(dialog.getByText('Escribe el costo, por ejemplo 12.50')).toBeVisible();

  // "1e2" passes the client gate as 100 — document what actually lands.
  await dialog.getByTestId('movimiento-cantidad').fill('1e2');
  await dialog.getByTestId('movimiento-costo').fill('3.33');
  await dialog.getByRole('button', { name: /^Registrar$/ }).click();
  await expect(dialog).not.toBeVisible();

  const [row] = await query(
    async (sql) => sql<{ cantidad: number; costo: number }[]>`
    SELECT cantidad::int, costo_unit_centavos::int AS costo
    FROM inventory_movements im
    JOIN products p ON p.id = im.producto_id
    WHERE p.sku = 'TAC-006' AND im.costo_unit_centavos = 333
    ORDER BY created_at DESC
    LIMIT 1`,
  );
  expect(row?.cantidad, '"1e2" is coerced to 100 before the server sees the string').toBe(100);
});

test.describe('login gate (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('script tag as login email gets the generic error, unreflected', async ({ page }) => {
    const dialogs = failOnJsDialog(page);

    await page.goto('/login');
    await page.getByTestId('login-email').fill(`<script>alert(1)</script>@x.com`);
    await page.getByTestId('login-password').fill('loquesea123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Recovery state: noValidate let the raw string reach the server; the answer
    // is the anti-enumeration copy, rendered once and unexecuted.
    await expect(
      page.getByText(/Correo o contraseña incorrectos\.|Escribe tu correo y tu contraseña\./),
    ).toBeVisible();
    expect(dialogs.fired()).toBe(false);
  });
});
