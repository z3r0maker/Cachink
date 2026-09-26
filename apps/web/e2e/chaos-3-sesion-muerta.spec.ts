import { expect, test } from './test';
import postgres from 'postgres';

import { BASE_URL } from './base-url';
import { clickUntil } from './interact';
import { restoreSharedBusinessName, SERIAL_TAG } from './shared-tenant';

/**
 * Chaos category 3 — expired / malformed session state.
 *
 * `xg_session` is an opaque 256-bit token resolved against Postgres on every
 * request, so killing it mid-flow must surface 'Inicia sesión para continuar.'
 * INSIDE the open form (a returned message — actions never redirect) and must
 * hard-gate the next navigation. The duplicate-tab test documents that
 * concurrent edits are silently last-write-wins with no conflict surfaced.
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

test('session death mid-edit returns the inline message, then the gate redirects', async ({
  page,
}) => {
  await page.goto('/productos');
  await clickUntil(
    page
      .locator('main')
      .locator('tr', { hasText: 'TAC-001' })
      .getByRole('button', { name: 'Editar' }),
    page.getByTestId('producto-nombre'),
  );
  await page.getByTestId('producto-nombre').fill(`Fantasma ${Date.now()}`);

  // The session vanishes while the drawer is open and filled.
  await page.context().clearCookies();

  await page.getByRole('button', { name: 'Guardar' }).click();

  // Recovery state 1: the action returns (it does not redirect from a form) and
  // the drawer's alert shows the exact copy — no silent success, no crash.
  await expect(page.getByTestId('producto-error')).toHaveText('Inicia sesión para continuar.');
  await expect(page.getByRole('button', { name: 'Guardar' })).toBeVisible();

  // Recovery state 2: the next navigation hard-redirects to the gate.
  await page.goto('/productos');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: '¿Cómo vas a entrar?' })).toBeVisible();

  // Recovery state 3: the dead session wrote nothing.
  const leaked = await query(async (sql) => {
    const [row] = await sql<
      { n: string }[]
    >`SELECT count(*)::text AS n FROM products WHERE sku = 'TAC-001' AND nombre LIKE '%Fantasma%'`;
    return Number(row?.n ?? 0);
  });
  expect(leaked, 'a dead session must not persist the draft').toBe(0);
});

test.describe('malformed session', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a forged xg_session never reaches app content', async ({ page }) => {
    await page
      .context()
      .addCookies([
        { name: 'xg_session', value: 'totalmente-falsificado-que-paso', url: BASE_URL },
      ]);

    await page.goto('/negocio');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: '¿Cómo vas a entrar?' })).toBeVisible();
  });
});

// The rename below is undone even when the test fails: the seeded name is the
// one the shell prints on every page, and leaving «Negocio B 1764…» there left
// every later reader of it guessing. Scoped to `serial` because the untagged
// tests in this file keep the hook in the viewport projects too, where writing
// the seeded tenant is refused outright (e2e/shared-tenant.ts).
test.afterAll(async ({}, testInfo) => {
  if (testInfo.project.name === 'serial') await restoreSharedBusinessName();
});

test(
  'duplicate tabs: a stale editor silently overwrites, no conflict surfaced',
  { tag: SERIAL_TAG },
  async ({ page, context }) => {
    // Two tabs, one shared cookie. Both editors load BEFORE either saves.
    const pageB = await context.newPage();
    await page.goto('/negocio');
    await pageB.goto('/negocio');
    await page.getByRole('button', { name: 'Editar negocio' }).click();
    await pageB.getByRole('button', { name: 'Editar negocio' }).click();

    const nameA = `Negocio A ${Date.now()}`;
    const nameB = `Negocio B ${Date.now()}`;
    await page.getByTestId('negocio-nombre').fill(nameA);
    await pageB.getByTestId('negocio-nombre').fill(nameB);

    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.locator('aside').getByText(nameA)).toBeVisible();
    await pageB.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(pageB.locator('aside').getByText(nameB)).toBeVisible();

    // Finding F-3: both saves succeed silently and NEITHER tab surfaces a conflict
    // warning — last-write-wins with no inline notice. (Non-empty only: Next's
    // `#__next-route-announcer__` is a 1×1 role="alert" on every page — it has a
    // bounding box, so a `visible` filter still counts it.)
    await expect(pageB.getByRole('alert').filter({ hasText: /\S/ })).toHaveCount(0);
    await expect(pageB.getByText('Algo salió mal')).toHaveCount(0);

    await pageB.close();
  },
);

test('export with a dead session lands on the 401 body, visibly', async ({ page }) => {
  await page.goto('/estados');
  await page.context().clearCookies();

  // Recovery state: the failure is observable (401 + body), never a silent
  // no-op. The click is retried with the wait, because a click dropped in the
  // hydration window fires no request at all and `waitForResponse` then sits
  // there until the test times out — this test's own flake, before and after the
  // serial projects landed. A 401 that never comes still fails.
  await expect(async () => {
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/export/ventas'), { timeout: 5_000 }),
      page.getByTestId('export-ventas').click(),
    ]);
    expect(response.status()).toBe(401);
  }).toPass({ timeout: 20_000, intervals: [500, 1_000, 2_000] });
  await expect(page.getByText('No autenticado')).toBeVisible();
});
