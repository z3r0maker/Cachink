import { defineConfig, devices } from '@playwright/test';

/**
 * The console's browser suite (N-05's follow-up). It refuses to run without
 * a database, exactly like the web's: the assertions are about RLS-gated
 * data and sessions, and a suite that skips them would read as green while
 * proving nothing.
 *
 * Local: `pnpm test:e2e` (wraps db-local's URLs). The staff fixture is
 * created by `e2e/global-setup.ts` (superuser INSERT, the CLI's own shape),
 * and TOTP enrolment happens through the page — the suite reads the seed
 * the enrolment screen shows for humans without a camera.
 */

const E2E_PORT = Number(process.env.E2E_PORT ?? 3200);
const BASE_URL = `http://localhost:${E2E_PORT}`;

/** The console reads cross-tenant: its connection is the `xangarro_admin` role. */
function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'DATABASE_URL is not set. The backoffice E2E suite runs against a seeded Postgres ' +
        '(db-local + the admin migrations), as the xangarro_admin role. Start it with ' +
        'pnpm --filter @xangarro/data-pg db:reset, then pnpm --filter @xangarro/backoffice test:e2e.',
    );
  }
  return url;
}

export default defineConfig({
  testDir: './e2e',
  // TOTP's replay guard means a second verify inside one 30-second step
  // waits out the window; the auth suite needs the headroom.
  timeout: 120_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  globalSetup: './e2e/global-setup.ts',
  use: { baseURL: BASE_URL, trace: 'retain-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: process.env.CI
      ? `pnpm exec next start -p ${E2E_PORT}`
      : `pnpm build && pnpm exec next start -p ${E2E_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    env: {
      DATABASE_URL: databaseUrl(),
      E2E_PORT: String(E2E_PORT),
      // Locally, a build of its own (see next.config): other sessions' builds
      // in this directory cannot swap it out mid-run. CI builds `.next` in
      // its own step and is alone on the runner — next start must find it.
      ...(process.env.CI ? {} : { NEXT_DIST_DIR: `.next-e2e/${E2E_PORT}` }),
      // Sign-in seals TOTP seeds with this key; a fixed test value is fine
      // because the whole run is local/CI throwaway data.
      ADMIN_TOTP_KEY: process.env.ADMIN_TOTP_KEY ?? 'MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=',
      ADMIN_INGEST_SECRET: process.env.ADMIN_INGEST_SECRET ?? 'e2e-ingest-secret',
      CRON_SECRET: process.env.CRON_SECRET ?? 'e2e-cron-secret',
    },
  },
});
