import postgres from 'postgres';

/**
 * Pre-flight. Fails the whole run in one sentence rather than in N red specs.
 *
 * Three checks, each catching a distinct way the suite could go green over
 * nothing:
 *   1. a `DATABASE_URL` exists at all;
 *   2. the database behind it is really seeded — a schema with no rows would
 *      render every screen's `empty` state, which is not `error` and would slip
 *      past a naive check;
 *   3. **the Next server** can read it. That is not implied by (1): Playwright
 *      reuses an already-listening dev server, so a stale `pnpm dev` started
 *      without the variable gets adopted and `webServer.env` never applies.
 */

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const SEEDED_PRODUCTS = 6;
const RESET = 'pnpm --filter @xangarro/portal test:e2e:db';

async function assertSeeded(url: string): Promise<void> {
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await sql`SELECT set_config('xangarro.business_id', ${BIZ}, false)`;
    const [row] = await sql<{ count: string }[]>`SELECT count(*)::text FROM products`;
    const found = Number(row?.count ?? 0);
    if (found !== SEEDED_PRODUCTS) {
      throw new Error(
        `The database has ${found} products for Taquería Don Pedro, expected ${SEEDED_PRODUCTS}.\n` +
          `It is not seeded (or is seeded differently). Run:\n  ${RESET}`,
      );
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function assertServerSeesDatabase(baseURL: string): Promise<void> {
  const res = await fetch(`${baseURL}/productos`);
  const body = await res.text();
  if (!body.includes('TAC-001')) {
    throw new Error(
      `The server at ${baseURL} is not rendering seeded data.\n` +
        'Most likely a dev server was already listening on that port without ' +
        'DATABASE_URL, so Playwright reused it and webServer.env never applied.\n' +
        `Stop it and run:\n  ${RESET}`,
    );
  }
}

export default async function globalSetup(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(`DATABASE_URL is not set. Run:\n  ${RESET}`);
  }
  await assertSeeded(url);
  await assertServerSeesDatabase(process.env.E2E_BASE_URL ?? 'http://localhost:3100');
}
