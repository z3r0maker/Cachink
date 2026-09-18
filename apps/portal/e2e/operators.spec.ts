import { compare } from 'bcryptjs';
import { expect, test, type Page } from '@playwright/test';
import postgres from 'postgres';

/**
 * Operator management (B-13 / P-05), end to end.
 *
 * Taquería Don Pedro is seeded at its plan's allowance — Xangarro includes 2
 * operators and the seed has Ana and Luis — so "Nuevo operador" starts
 * disabled, and the only way to add someone is to deactivate someone first.
 * That is the rule, exercised through the portal rather than asserted about it.
 *
 * Serial and desktop-only: every test mutates the demo business's operators.
 */
test.describe.configure({ mode: 'serial' });

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';

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

test('a full allowance is freed by deactivating, and a new operator takes the slot', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates shared operators');

  await page.goto('/equipo');
  await expect(page.getByText('2 de 2 operadores')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo operador' })).toBeDisabled();

  const before = await usersLogged();

  // Free a slot.
  await card(page, 'Luis Ortega').getByRole('button', { name: 'Desactivar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
  await expect(page.getByText('1 de 2 operadores')).toBeVisible();

  // Take it.
  await page.getByRole('button', { name: 'Nuevo operador' }).click();
  await page.getByTestId('operador-nombre').fill('Rosa Medina');
  await page.getByTestId('operador-pin').fill('4321');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('2 de 2 operadores')).toBeVisible();
  await expect(page.locator('main').getByText('Rosa Medina', { exact: true })).toBeVisible();

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
});

test('a PIN reset replaces the old one', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates shared operators');

  await page.goto('/equipo');
  await card(page, 'Rosa Medina').getByRole('button', { name: 'Restablecer PIN' }).click();
  await page.getByTestId('operador-nuevo-pin').fill('12');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByText('El PIN debe tener de 4 a 6 números.')).toBeVisible();

  await page.getByTestId('operador-nuevo-pin').fill('909090');
  await page.getByRole('dialog').getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  const hashValue = await db(async (sql) => {
    const [r] = await sql<
      { pin_hash: string }[]
    >`SELECT pin_hash FROM users WHERE nombre = 'Rosa Medina'`;
    return r?.pin_hash ?? '';
  });
  expect(await compare('909090', hashValue)).toBe(true);
  expect(await compare('4321', hashValue)).toBe(false);
});

test('deactivating the last active operator is allowed, and warned about', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates shared operators');

  await page.goto('/equipo');
  for (const nombre of ['Ana Robledo', 'Rosa Medina']) {
    await card(page, nombre).getByRole('button', { name: 'Desactivar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Desactivar' }).click();
  }
  await expect(page.getByTestId('operador-warning')).toContainText(
    'Ya no queda ningún operador activo',
  );
});
