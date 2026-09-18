import { defineConfig, devices } from '@playwright/test';

import devKeys from '../../packages/contracts/src/mock/dev-keys.json' with { type: 'json' };

import { OWNER_STORAGE } from './e2e/auth-state';
import { BASE_URL, E2E_PORT } from './e2e/base-url';

/** The contract's published test key — never a production fallback. */
const TEST_ENTITLEMENT_KEY = devKeys.privateHex;

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
    command: process.env.CI
      ? `pnpm exec next start -p ${E2E_PORT}`
      : `pnpm build && pnpm exec next start -p ${E2E_PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 60_000 : 240_000,
    // Redundant with env inheritance, and kept anyway: it is the only place a
    // reader learns this server is database-backed.
    env: {
      // Locally, a build of its own (see next.config.mjs): other sessions'
      // builds in this directory cannot swap it out mid-run. CI builds `.next`
      // in its own step and is alone on the runner.
      ...(process.env.CI ? {} : { NEXT_DIST_DIR: `.next-e2e/${E2E_PORT}` }),
      DATABASE_URL: databaseUrl(),
      // /activate signs a device token and an entitlement. The entitlement key
      // is the contract's published TEST key, passed explicitly: the portal has
      // no default for it on purpose (server/device/credentials.ts).
      DEVICE_TOKEN_SECRET: process.env.DEVICE_TOKEN_SECRET ?? 'e2e-only-not-a-real-secret',
      ENTITLEMENT_PRIVATE_KEY: process.env.ENTITLEMENT_PRIVATE_KEY ?? TEST_ENTITLEMENT_KEY,
    },
  },
  use: {
    baseURL: BASE_URL,
    // No retries locally, so `retain-on-failure`: the first failure is the one
    // that has to be debuggable.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Signs in once; every other project reuses the cookie. `auth.spec.ts`
    // exercises the form and the gate, so the suite is not also testing login
    // a hundred times.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      dependencies: ['setup'],
      testIgnore: /sync\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: OWNER_STORAGE,
      },
    },
    // The design's two responsive breakpoints: laptop and the tablet rail.
    {
      name: 'laptop',
      dependencies: ['setup'],
      testIgnore: /sync\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 800 },
        storageState: OWNER_STORAGE,
      },
    },
    {
      name: 'tablet',
      dependencies: ['setup'],
      testIgnore: /sync\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        storageState: OWNER_STORAGE,
      },
    },
    // Phones pushing and pulling against the demo business. Last, after every
    // viewport, so activating phones and rewriting Taquería's rows cannot race
    // the specs that read them — devices.spec above all, which counts slots.
    {
      name: 'sync',
      dependencies: ['desktop', 'laptop', 'tablet'],
      testMatch: /sync\.spec\.ts/,
      // One file at a time: each activates phones on Taquería, which has two
      // device slots, and revokes the previous file's.
      workers: 1,
      use: { ...devices['Desktop Chrome'], storageState: OWNER_STORAGE },
    },
  ],
});
