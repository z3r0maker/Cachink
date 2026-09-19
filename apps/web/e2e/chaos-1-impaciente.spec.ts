import { expect, test, type Locator } from '@playwright/test';
import postgres from 'postgres';

/**
 * Chaos category 1 — the impatient, chaotic user.
 *
 * This file hunts the portal's weakest link: `ConfirmDialog`'s confirm button
 * has no `disabled` prop (src/components/dialog.tsx:53) and no portal server
 * action carries an idempotency key. The tests widen the in-flight window with
 * a `page.route` delay so the race is deterministic, then assert the system
 * recovers to a single, consistent state.
 *
 * The login form — which guards with `disabled={pending}` — and the operador
 * caja (local state, toast replacement) are the resilient controls that prove
 * the movimiento double-write is a defect, not a framework limit.
 *
 * Desktop-only for the mutating tests: `fullyParallel` runs the three viewport
 * projects against one Postgres, so each test owns a distinct seeded product.
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

/** Five near-simultaneous clicks; clicks that land on a disabled/gone button
 *  are swallowed — exactly what a human button-smash produces. */
async function smash(button: Locator): Promise<void> {
  await Promise.all(
    Array.from({ length: 5 }, () => button.click({ timeout: 2_000 }).catch(() => undefined)),
  );
}

test('smashing "Registrar" on a movimiento must not double-write inventory', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');

  let actionPosts = 0;
  // Server actions POST to the page URL. Only delay POSTs (never the page GET)
  // so the pending window outlives the smash.
  await page.route('**/productos', async (route) => {
    if (route.request().method() === 'POST') {
      actionPosts += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
    await route.continue();
  });

  await page.goto('/productos');
  await page
    .locator('main')
    .locator('tr', { hasText: 'TAC-001' })
    .getByRole('button', { name: 'Movimiento' })
    .click();

  const dialog = page.getByRole('dialog');
  await dialog.getByTestId('movimiento-cantidad').fill('2');
  await dialog.getByTestId('movimiento-costo').fill('7.77');

  await smash(dialog.getByRole('button', { name: /^Registrar$|^Guardando…$/ }));

  // Recovery state 1: the dialog closes and the table re-renders from the DB.
  await expect(dialog).not.toBeVisible();
  // Every escaped POST is staggered ~400 ms; settle so all writes land before counting.
  await new Promise((resolve) => setTimeout(resolve, 2_500));

  // Recovery state 2: EXACTLY one movement row with the marker cost (777
  // centavos). More than one row means the double-write reached every phone.
  const rows = await query(async (sql) => {
    const [row] = await sql<{ n: string }[]>`
      SELECT count(*)::text AS n
      FROM inventory_movements im
      JOIN products p ON p.id = im.producto_id
      WHERE p.sku = 'TAC-001' AND im.costo_unit_centavos = 777`;
    return Number(row?.n ?? 0);
  });
  expect(rows, `5 rapid clicks must yield 1 movement (observed ${actionPosts} action POSTs)`).toBe(
    1,
  );
});

test.describe('login gate (signed out)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('smashing "Entrar" recovers to a single error state, no crash', async ({ page }) => {
    let actionPosts = 0;
    await page.route('**/login', async (route) => {
      if (route.request().method() === 'POST') actionPosts += 1;
      await route.continue();
    });

    await page.goto('/login');
    await page.getByTestId('login-email').fill(`nadie-${Date.now()}@example.com`);
    await page.getByTestId('login-password').fill('incorrecta');

    const entrar = page.getByRole('button', { name: /^Entrar$|^Entrando…$/ });
    await Promise.all(
      Array.from({ length: 6 }, () => entrar.click({ timeout: 2_000 }).catch(() => undefined)),
    );

    // Recovery state: an error renders (either the anti-enumeration pair or, if
    // the throttle tripped on the unique address, the lockout line), the shell
    // is intact, and we are still on the gate.
    await expect(
      page.getByText(/Correo o contraseña incorrectos\.|Demasiados intentos\./),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Entra a tu portal' })).toBeVisible();
    expect(page.url()).toContain('/login');
    expect(actionPosts).toBeGreaterThanOrEqual(1);
  });
});

test('reloading mid-save leaves DB and UI reconciled, no phantom state', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'mutates a shared row');

  await page.route('**/productos', async (route) => {
    if (route.request().method() === 'POST')
      await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });

  const readName = () =>
    query(async (sql) => {
      const [row] = await sql<
        { nombre: string }[]
      >`SELECT nombre FROM products WHERE sku = 'TAC-003'`;
      return row?.nombre ?? '';
    });
  const oldName = await readName();
  const newName = `Taco al pastor ${Date.now()}`;

  await page.goto('/productos');
  await page
    .locator('main')
    .locator('tr', { hasText: 'TAC-003' })
    .getByRole('button', { name: 'Editar' })
    .click();
  await page.getByTestId('producto-nombre').fill(newName);
  await page.getByRole('button', { name: 'Guardar' }).click();
  // Kill the tab while the action POST is still in flight.
  await page.reload();

  // Recovery state: the row is old OR new — never half-written — and the
  // re-rendered table agrees with Postgres.
  await page.goto('/productos');
  const dbName = await readName();
  expect([oldName, newName], 'a killed in-flight write must land atomically').toContain(dbName);
  await expect(page.locator('main').getByText(dbName)).toBeVisible();
});

test('operador: smashing Cobrar and Registrar venta yields ONE registered sale', async ({
  page,
}) => {
  // /operador/* is fixture-driven and session-free (device-local): pure client chaos.
  await page.goto('/operador/caja');

  await page
    .getByRole('button', { name: /Taco de pastor/ })
    .first()
    .click();
  const cobrar = page
    .getByRole('button', { name: 'Cobrar', exact: true })
    .filter({ visible: true })
    .first();
  await expect(cobrar).toBeEnabled();

  await smash(cobrar);

  const modal = page.getByRole('dialog');
  await expect(modal).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await modal.getByRole('button', { name: 'Efectivo', exact: true }).click();
  await modal.getByLabel('Con cuánto paga').fill('100');

  await smash(modal.getByRole('button', { name: /^Registrar venta$/ }));

  // Recovery state: exactly one success toast (toast replacement absorbs the
  // smash), the ticket is cleared, and Cobrar is gated again.
  await expect(page.getByRole('status').filter({ hasText: 'Venta registrada' })).toHaveCount(1);
  await expect(cobrar).toBeDisabled();
});
