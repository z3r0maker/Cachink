import { defineConfig, devices } from '@playwright/test';

/**
 * Portal accessibility and state/role sweep (P-16).
 *
 * Fase 5's check 3: "Para cada pantalla se fuerzan los cuatro estados y los
 * tres roles, y se verifica el sello al presionar, el foco visible y los
 * objetivos de 44 px." This config runs that plus `@axe-core/playwright`.
 *
 * It builds and serves a **production** build: `NODE_ENV=production` matters
 * (see task P-20 — a development NODE_ENV corrupts the Next build), and
 * `--webpack` is required because vanilla-extract's plugin is a webpack
 * integration while Next 16 defaults to Turbopack (ADR-057).
 *
 * The side-by-side design comparison is deliberately **not** here: it is a
 * review, not a gate (ADR-058).
 * The suite runs against a **seeded Postgres**, and refuses to run without one.
 * It used to pass with no database at all: every page catches its loader's
 * throw and renders the `error` state, so 79 specs were sweeping eleven error
 * cards. There is deliberately no opt-out flag — that is how this would rot
 * back to where it was.
 */

/** Throws rather than letting the suite start against no database. */
function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url === undefined || url === '') {
    throw new Error(
      'DATABASE_URL is not set. The portal E2E suite runs against a seeded Postgres.\n' +
        'Run `pnpm --filter @xangarro/portal test:e2e:db` rather than `playwright test`.',
    );
  }
  return url;
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  retries: process.env.CI ? 1 : 0,
  globalSetup: './e2e/global-setup.ts',
  webServer: {
    // CI builds in its own step, so a build failure reads as a build failure
    // rather than as "webServer timed out".
    command: process.env.CI ? 'pnpm start' : 'pnpm build && pnpm start',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60_000 : 240_000,
    // Redundant with env inheritance, and kept anyway: it is the only place a
    // reader learns this server is database-backed.
    env: { DATABASE_URL: databaseUrl() },
  },
  use: {
    baseURL: 'http://localhost:3100',
    // No retries locally, so `retain-on-failure`: the first failure is the one
    // that has to be debuggable.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    // The design's two responsive breakpoints: laptop and the tablet rail.
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 800 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
  ],
});
