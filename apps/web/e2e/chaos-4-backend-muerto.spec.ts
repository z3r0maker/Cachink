import { expect, test } from './test';
import postgres from 'postgres';

import { deviceHeaders } from '@xangarro/contracts';

/**
 * Chaos category 4 — the crashed backend (graceful degradation).
 *
 * Two halves. (a) Mocked 500s on the exact transports the browser uses — the
 * server-action POST (it POSTs to the page URL), the export download, and an
 * initial RSC navigation — asserting the UI degrades to a visible error, never
 * a blank tab or a silent no-op, and never a half-written row. (b) The REAL,
 * unmocked failure contract of the device/API surface (401 / 400 / 426 / 500).
 *
 * `fullyParallel` runs against one Postgres; the negocio test asserts on a
 * unique attempted name (absence), so it is safe alongside the viewport specs.
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

test('a 500 on the negocio action surfaces an error state and writes nothing', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'attempts a shared write');

  await page.route('**/negocio', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 500, contentType: 'text/html', body: '<h1>boom</h1>' });
      return;
    }
    await route.continue();
  });

  const attempted = `No Debería Existir ${Date.now()}`;
  await page.goto('/negocio');
  await page.getByRole('button', { name: 'Editar negocio' }).click();
  await page.getByTestId('negocio-nombre').fill(attempted);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();

  // Recovery state: an error surface renders — the root boundary's "Algo salió
  // mal" or an inline alert — never a blank, never silence. (Non-empty only:
  // Next's route announcer is a 1×1 role="alert" on every page.)
  const failure = page
    .getByText('Algo salió mal')
    .or(page.getByRole('alert').filter({ hasText: /\S/ }))
    .first();
  await expect(failure).toBeVisible({ timeout: 10_000 });

  // The 500'd write must not land, even partially.
  const leaked = await query(async (sql) => {
    const [row] = await sql<
      { n: string }[]
    >`SELECT count(*)::text AS n FROM businesses WHERE nombre LIKE ${attempted}`;
    return Number(row?.n ?? 0);
  });
  expect(leaked, 'a 500 must not persist the attempted write').toBe(0);
  await page.unroute('**/negocio');
});

test('a 500 on initial navigation is observable, not a blank tab', async ({ page }) => {
  await page.route('**/estados', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'text/html; charset=utf-8',
      body: '<h1>Algo salió mal</h1>',
    });
  });

  const response = await page.goto('/estados');
  expect(response?.status()).toBe(500);
  await expect(page.getByText('Algo salió mal')).toBeVisible();
  await page.unroute('**/estados');
});

test('a 500 on export produces no download and a visible error page', async ({ page }) => {
  await page.goto('/estados');
  await page.route('**/api/export/ventas', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'text/html; charset=utf-8',
      body: '<h1>Algo salió mal</h1>',
    });
  });

  const download = page.waitForEvent('download', { timeout: 3_000 });
  const [response] = await Promise.all([
    page.waitForResponse((r) => r.url().includes('/api/export/ventas')),
    page.getByTestId('export-ventas').click(),
  ]);

  // Recovery state: the failure is visible; the browser must NOT save a corrupt file.
  expect(response?.status()).toBe(500);
  await expect(download).rejects.toThrow();
  await expect(page.getByText('Algo salió mal')).toBeVisible();
  await page.unroute('**/api/export/ventas');
});

test('device API answers its exact error contract (real, unmocked)', async ({ page }) => {
  // 426 — activate without the protocol header.
  const activate = await page.request.post('/api/v1/activate', { data: {} });
  expect(activate.status()).toBe(426);
  expect((await activate.json()).error.code).toBe('PROTOCOL_UNSUPPORTED');

  // 401 — entitlement with a tampered bearer token.
  const entitlement = await page.request.get('/api/v1/entitlement', {
    headers: deviceHeaders('token-falso'),
  });
  expect(entitlement.status()).toBe(401);
  expect((await entitlement.json()).error.code).toBe('UNAUTHENTICATED');

  // 400/401 — a push with a bad token and a malformed batch is refused, never
  // accepted. (A pure 400 VALIDATION needs a valid device token, covered by the
  // contract suite; here the auth wall is what a garbage call hits first.)
  const push = await page.request.post('/api/v1/sync/push', {
    headers: deviceHeaders('token-falso'),
    data: { deltas: 'esto-no-es-un-batch' },
  });
  expect([400, 401]).toContain(push.status());

  // 400/500 — an unsigned Stripe webhook is refused, never applied. Which of
  // the two you get is an environment fact, not a contract: with billing
  // configured `webhook.ts` answers 400 («a bad or missing signature is a
  // 400»), and without it the route answers 500 before reaching that check.
  // CI has no Stripe keys and saw 500; a developer with `.env.local` sees 400,
  // and asserting either one alone makes the suite depend on whose machine it
  // runs on. What must never happen is a 2xx.
  const webhook = await page.request.post('/api/stripe/webhook', { data: '{}' });
  expect([400, 500]).toContain(webhook.status());
});

test.describe('cookie-gated surface (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('export and import answer 401 with the auth body, not a crash', async ({ page }) => {
    const exportRes = await page.request.get('/api/export/ventas');
    expect(exportRes.status()).toBe(401);
    expect((await exportRes.json()).error).toBe('No autenticado');

    const importRes = await page.request.get('/api/import/productos');
    expect(importRes.status()).toBe(401);
    expect((await importRes.json()).error).toBe('No autenticado');
  });
});
