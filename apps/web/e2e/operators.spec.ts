import { compare } from 'bcryptjs';
import { expect, test, type Page } from './test';
import postgres from 'postgres';

import { SERIAL_TAG, SHARED_BIZ } from './shared-tenant';

/**
 * Operator management (B-13 / P-05), end to end.
 *
 * Taquería Don Pedro is on Xangarro — dueño + 2 empleados, so 3 operator seats
 * (ADR-106) — and the seed has Ana and Luis. Adding Rosa fills the allowance and
 * disables "Nuevo operador"; deactivating someone frees a seat again. That is
 * the rule, exercised through the portal rather than asserted about it.
 *
 * Every test mutates the demo business's operators, so every test is `@serial`:
 * the `serial` project runs the file once, after the viewport projects have
 * finished reading those rows (e2e/shared-tenant.ts).
 */
test.describe.configure({ mode: 'serial' });

const BIZ = SHARED_BIZ;

async function db<T>(fn: (sql: postgres.Sql) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    return await fn(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

const usersLogged = () =>
  db(async (sql) => {
    const [r] = await sql<
      { n: string }[]
    >`SELECT count(*)::text AS n FROM sync_log WHERE table_name = 'users'`;
    return Number(r?.n ?? 0);
  });

const card = (page: Page, nombre: string) =>
  page
    .locator('main')
    .locator('div', { has: page.getByText(nombre, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'Desactivar' }) })
    .last();

test(
  'a new operator fills the allowance, and deactivating frees a seat',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    await page.goto('/equipo');
    await expect(page.getByText('2 de 3 operadores')).toBeVisible();

    const before = await usersLogged();

    // Take the free seat.
    await page.getByRole('button', { name: 'Nuevo operador' }).click();
    await page.getByTestId('operador-nombre').fill('Rosa Medina');
    await page.getByTestId('operador-pin').fill('4321');
    await expect(page.getByTestId('operador-pin')).toHaveAttribute('type', 'password');
    await page.getByTestId('operador-pin-confirmar').fill('4312');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('Los dos NIP no coinciden.')).toBeVisible();
    await page.getByTestId('operador-pin-confirmar').fill('4321');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByText('3 de 3 operadores')).toBeVisible();
    await expect(page.locator('main').getByText('Rosa Medina', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuevo operador' })).toBeDisabled();

    // Free one again.
    await card(page, 'Luis Ortega').getByRole('button', { name: 'Desactivar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
    await expect(page.getByText('2 de 3 operadores')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nuevo operador' })).toBeEnabled();

    // The PIN is stored hashed and verifies; and both writes reached sync_log,
    // because every phone pulls `users` — a deactivation that never left the
    // cloud would keep Luis signing in on the counter phone.
    const hashValue = await db(async (sql) => {
      const [r] = await sql<
        { pin_hash: string }[]
      >`SELECT pin_hash FROM users WHERE nombre = 'Rosa Medina'`;
      return r?.pin_hash ?? '';
    });
    expect(hashValue).not.toBe('4321');
    expect(await compare('4321', hashValue)).toBe(true);
    expect(await usersLogged()).toBe(before + 2);
  },
);

test('a NIP reset replaces the old one', { tag: SERIAL_TAG }, async ({ page }) => {
  await page.goto('/equipo');
  // The seeded tenant is on Xangarro: an active card, and no permissions editor.
  await expect(
    card(page, 'Rosa Medina').getByRole('button', { name: 'Reiniciar NIP' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar permisos' })).toHaveCount(0);
  await card(page, 'Rosa Medina').getByRole('button', { name: 'Reiniciar NIP' }).click();
  await page.getByTestId('operador-nuevo-pin').fill('12');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('El NIP debe tener 4 números.')).toBeVisible();

  await page.getByTestId('operador-nuevo-pin').fill('9090');
  await page.getByTestId('operador-nuevo-pin-confirmar').fill('9090');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const hashValue = await db(async (sql) => {
    const [r] = await sql<
      { pin_hash: string }[]
    >`SELECT pin_hash FROM users WHERE nombre = 'Rosa Medina'`;
    return r?.pin_hash ?? '';
  });
  expect(await compare('9090', hashValue)).toBe(true);
  expect(await compare('4321', hashValue)).toBe(false);
});

test(
  'deactivating the last active operator is allowed, and warned about',
  { tag: SERIAL_TAG },
  async ({ page }) => {
    await page.goto('/equipo');
    for (const nombre of ['Ana Robledo', 'Rosa Medina']) {
      await card(page, nombre).getByRole('button', { name: 'Desactivar' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
    }
    await expect(page.getByTestId('operador-warning')).toContainText(
      'Ya no queda ningún operador activo',
    );
  },
);

test.afterAll(async () => {
  // The last test deactivates every operator to see the warning; later files
  // (acceso's picker, permisos' grant) read them active. Leave the seed whole.
  await db(
    (sql) => sql`UPDATE users SET active = true, updated_at = now() WHERE business_id = ${BIZ}`,
  );
});
