import { expect, test, type Page } from './test';
import postgres from 'postgres';

import { clickUntil } from './interact';
import { SERIAL_TAG } from './shared-tenant';

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
 * distinct seeded product (TAC-001, QUE-001, GRI-001, MP-001) — and carries
 * `@serial`, which is what keeps them out of the parallel phase entirely. That
 * part is enforced, not promised: while the viewport projects run, a trigger
 * refuses every write to this tenant (e2e/shared-tenant.ts).
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
  await clickUntil(
    page.locator('main').locator('tr', { hasText: sku }).getByRole('button', { name: 'Editar' }),
    page.getByTestId('producto-nombre'),
  );
}

/** Fail the test the instant any JS dialog (alert/confirm/prompt) fires. */
function failOnJsDialog(page: Page): { fired: () => boolean } {
  let fired = false;
  page.on('dialog', () => {
    fired = true;
  });
  return { fired: () => fired };
}

test(
  'script tag in a product name is stored verbatim and rendered as text',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    const dialogs = failOnJsDialog(page);

    const payload = `<script>alert('cachink')</script>`;
    await openEditor(page, 'TAC-001');
    await page.getByTestId('producto-nombre').fill(payload);
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Recovery state: the drawer closed (server accepted) and the payload is
    // visible as literal text — escaping held, nothing executed.
    await expect(page.getByTestId('producto-error')).toHaveCount(0);
    await expect(page.locator('main').getByText(payload, { exact: true })).toBeVisible();
    expect(dialogs.fired(), 'no alert()/confirm() may ever fire from stored data').toBe(false);

    const [row] = await query(
      async (sql) => sql<{ nombre: string }[]>`SELECT nombre FROM products WHERE sku = 'TAC-001'`,
    );
    expect(row?.nombre).toBe(payload);
  },
);

test(
  'a 10,000-character name is refused by the server, row untouched',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    const readName = () =>
      query(async (sql) => {
        const [row] = await sql<
          { nombre: string }[]
        >`SELECT nombre FROM products WHERE sku = 'QUE-001'`;
        return row?.nombre ?? '';
      });
    const before = await readName();

    await openEditor(page, 'QUE-001');
    await page.getByTestId('producto-nombre').fill('A'.repeat(10_000));
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Recovery state: the alert container renders (server Zod max 120) with a
    // non-empty message, the drawer stays open with the draft, and Postgres is untouched.
    const error = page.getByTestId('producto-error');
    await expect(error).toBeVisible();
    await expect(error).not.toBeEmpty();
    await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible();
    expect(await readName()).toBe(before);
  },
);

/** Seeded SKUs this test never touches: if the payload had run, they would be gone. */
const SEMBRADOS = ['BEB-001', 'BEB-002', 'MP-001', 'QUE-001'] as const;

/** The seeded Gringa, by id — the one row this test is allowed to wreck. */
const GRINGA = '01HZ8XQN9GZJXV8AKQ5X0PGRN1';

const restaurarGringa = () =>
  query((sql) => sql`UPDATE products SET nombre = 'Gringa', sku = 'GRI-001' WHERE id = ${GRINGA}`);

// Put it back even when the test fails. The payload replaces both the name and
// the SKU, and a row left mangled follows the suite around: it is what took
// `operador-caja.spec.ts` down two projects later.
//
// The hook runs in every project this file has a test in, and the untagged
// login-gate tests below keep it in the viewport projects too — where the
// restore would be both a shared write (the guard refuses it) and a way to wipe
// the payload from under the serial run. So it is scoped to `serial`, the only
// project the mutating tests run in.
test.afterAll(async ({}, testInfo) => {
  if (testInfo.project.name === 'serial') await restaurarGringa();
});

test(
  'SQL fragments in name and SKU are inert end to end',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    const dialogs = failOnJsDialog(page);

    const nombre = `🌮 peor caso'); DROP TABLE products; --`;
    const sku = `x'; DELETE FROM products WHERE '1'='1`;

    // This test's payload *is* the SKU it looks the row up by, so one run leaves
    // no GRI-001 for the next: it passed on a fresh seed and timed out on every
    // re-run, looking for a row it had renamed itself. Put the fixture back
    // first, by id, so the test is honest about owning this row and can run
    // twice.
    await restaurarGringa();

    await openEditor(page, 'GRI-001');
    await page.getByTestId('producto-nombre').fill(nombre);
    await page.getByTestId('producto-sku').fill(sku);
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Recovery state: the payload renders as text and the parameterized query held.
    await expect(page.locator('main').getByText(nombre, { exact: true })).toBeVisible();
    expect(dialogs.fired()).toBe(false);

    const state = await query(async (sql) => {
      const [row] = await sql<
        { nombre: string; sku: string | null }[]
      >`SELECT nombre, sku FROM products WHERE sku = ${sku}`;
      const vivos = await sql<
        { sku: string }[]
      >`SELECT sku FROM products WHERE sku IN ${sql(SEMBRADOS)} AND deleted_at IS NULL`;
      return { row, vivos: vivos.map((r) => r.sku).sort() };
    });
    // Not `count(*)`: the operador project seeds its own products in parallel, so
    // the total moves under this test for reasons that have nothing to do with
    // the payload — a census here failed for someone else's fixture. `DROP TABLE`
    // and `DELETE FROM products WHERE '1'='1'` would both take the seeded rows
    // with them, so naming them is the sharper claim.
    expect(state.vivos, 'products table must survive the injection attempt').toEqual([
      ...SEMBRADOS,
    ]);
    expect(state.row?.nombre).toBe(nombre);
  },
);

test(
  'movimiento cantidad launders exponents/hex through Number()',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    await page.goto('/productos');
    await page
      .locator('main')
      .locator('tr', { hasText: 'MP-001' })
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
    SELECT im.cantidad::int, im.costo_unit_centavos::int AS costo
    FROM inventory_movements im
    JOIN products p ON p.id = im.producto_id
    WHERE p.sku = 'MP-001' AND im.costo_unit_centavos = 333
    ORDER BY im.created_at DESC
    LIMIT 1`,
    );
    expect(row?.cantidad, '"1e2" is coerced to 100 before the server sees the string').toBe(100);
  },
);

test.describe('login gate (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('script tag as login email gets the generic error, unreflected', async ({ page }) => {
    const dialogs = failOnJsDialog(page);

    await page.goto('/login');
    await page.getByTestId('login-door-owner').click();
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
