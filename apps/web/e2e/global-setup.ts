import postgres from 'postgres';

import { clearLocalThrottles } from '../scripts/local-throttles';
import { BASE_URL } from './base-url';

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
const SEEDED_PRODUCTS = 8;
const RESET = 'pnpm --filter @xangarro/web test:e2e:db';

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

/**
 * The server is up, compiled, and serving the gate.
 *
 * This used to fetch `/productos` and look for seeded data, which stopped
 * meaning what it said the moment P-02 landed: every product route now
 * redirects a cookie-less request to `/login`, so the absence of `TAC-001`
 * proves the gate works, not that the database is unreachable.
 *
 * The server-side database proof moved somewhere better. `auth.setup.ts` signs
 * in, and login reads `auth.users` **on the server** — so a server without a
 * working `DATABASE_URL` fails there, before any spec runs. Checking the login
 * page here still catches the cruder failure: a stale dev server on this port,
 * or a build that never compiled.
 */
async function assertServerIsServingTheGate(baseURL: string): Promise<void> {
  const res = await fetch(`${baseURL}/login`, { redirect: 'follow' });
  const body = await res.text();
  if (!res.ok || !body.includes('¿Cómo vas a entrar?')) {
    throw new Error(
      `The server at ${baseURL} did not serve the login page (HTTP ${res.status}).\n` +
        'Most likely something else is already listening on that port, or the ' +
        'build did not complete.\n' +
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
  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  try {
    await clearLocalThrottles(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
  await assertServerIsServingTheGate(BASE_URL);
}
