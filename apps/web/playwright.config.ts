import { createRequire } from 'node:module';

import { defineConfig, devices } from '@playwright/test';

import devKeys from '../../packages/contracts/src/mock/dev-keys.json' with { type: 'json' };

import { OWNER_STORAGE } from './e2e/auth-state';
import { BASE_URL, E2E_PORT } from './e2e/base-url';
import { billingDatabaseUrl, superDatabaseUrl } from './e2e/db-url';
import { SERIAL_TAG } from './e2e/shared-tenant';
import { INSPECT_PORT, SERVER_V8_DIR, coverageEnabled } from './scripts/coverage-gate/options';

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
        'Run `pnpm --filter @xangarro/web test:e2e:db` rather than `playwright test`.',
    );
  }
  return url;
}

/** Files that belong to a project of their own, never to a viewport. */
const OTHER_PROJECTS = /sync\.spec\.ts|operador-.*\.spec\.ts|devices\.spec\.ts/;

/** The viewport projects: the whole parallel phase. */
const VIEWPORTS = ['desktop', 'laptop', 'tablet'] as const;

/** The desktop browser the non-viewport projects use. */
const DESKTOP = {
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 900 },
  storageState: OWNER_STORAGE,
} as const;

/**
 * What `unlock` waits for: the whole parallel phase, so the seeded tenant's
 * write lock comes off only once those projects have finished reading it.
 *
 * `XG_E2E_NO_VIEWPORTS=1` drops the dependency, for a focused run of one serial
 * project while working on it (`--project=operador`). Opt-in on purpose: several
 * `sync` specs read state the viewport phase leaves behind, so the honest
 * default is to run it, exactly as `sync` always did.
 */
const AFTER_VIEWPORTS = process.env.XG_E2E_NO_VIEWPORTS === '1' ? [] : [...VIEWPORTS];

/**
 * The server command. Under coverage (ADR-102) it is `next start` run by
 * `node` directly — through `pnpm exec`, the inspector would open on pnpm's
 * process rather than Next's — with NODE_V8_COVERAGE on the server alone, so
 * the build's own processes never write into it.
 */
function serverCommand(): string {
  const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next');
  const start = coverageEnabled
    ? `NODE_V8_COVERAGE=${SERVER_V8_DIR} node --inspect=127.0.0.1:${INSPECT_PORT} ${nextBin} start -p ${E2E_PORT}`
    : `pnpm exec next start -p ${E2E_PORT}`;
  // CI builds in its own step, so a build failure reads as a build failure
  // rather than as "webServer timed out".
  return process.env.CI ? start : `pnpm build && ${start}`;
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: process.env.CI
    ? [['github'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  retries: process.env.CI ? 1 : 0,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  webServer: {
    command: serverCommand(),
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
      DATABASE_SUPER_URL: superDatabaseUrl(),
      // The seed's day (seed-data.ts `TODAY`): its May rows are "this month".
      PORTAL_TODAY: process.env.PORTAL_TODAY ?? '2026-05-12',
      // /activate signs a device token and an entitlement. The entitlement key
      // is the contract's published TEST key, passed explicitly: the portal has
      // no default for it on purpose (server/device/credentials.ts).
      DEVICE_TOKEN_SECRET: process.env.DEVICE_TOKEN_SECRET ?? 'e2e-only-not-a-real-secret',
      ENTITLEMENT_PRIVATE_KEY: process.env.ENTITLEMENT_PRIVATE_KEY ?? TEST_ENTITLEMENT_KEY,
      BILLING_DATABASE_URL: billingDatabaseUrl(),
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
    // The parallel phase: the three viewports, reading the seeded tenant.
    // `grepInvert` is the half that makes that true — every test that writes
    // Taquería Don Pedro's rows carries `@serial` and runs in the serial
    // project below instead. A Postgres trigger enforces it while these run
    // (e2e/shared-tenant.ts), so an untagged write fails here rather than
    // corrupting a sibling four files away.
    {
      name: 'desktop',
      dependencies: ['setup'],
      // Every operator screen lives behind the real door in the serial
      // `operador` project (O-38); the viewport projects never run them.
      testIgnore: OTHER_PROJECTS,
      grepInvert: new RegExp(SERIAL_TAG),
      use: { ...DESKTOP },
    },
    // The design's two responsive breakpoints: laptop and the tablet rail.
    {
      name: 'laptop',
      dependencies: ['setup'],
      testIgnore: OTHER_PROJECTS,
      grepInvert: new RegExp(SERIAL_TAG),
      use: { ...DESKTOP, viewport: { width: 1024, height: 800 } },
    },
    {
      name: 'tablet',
      dependencies: ['setup'],
      testIgnore: OTHER_PROJECTS,
      grepInvert: new RegExp(SERIAL_TAG),
      use: { ...DESKTOP, viewport: { width: 768, height: 1024 } },
    },
    // One step, between the two phases: it takes the write lock off the seeded
    // tenant for everything that follows.
    {
      name: 'unlock',
      testMatch: /shared-tenant\.unlock\.ts/,
      dependencies: AFTER_VIEWPORTS,
    },
    // The mutators. `workers: 1` and after the viewports, because they rewrite
    // rows the parallel phase reads: renaming the business, marking every aviso
    // read, revoking devices, clearing a corte. Four consecutive full runs used
    // to fail in four different files for exactly this, each of them passing
    // alone (ADR-103).
    {
      name: 'serial',
      dependencies: ['setup', 'unlock'],
      testIgnore: OTHER_PROJECTS,
      grep: new RegExp(SERIAL_TAG),
      workers: 1,
      use: { ...DESKTOP },
    },
    // O-38: the operator screens behind the real door. Serial like `sync`
    // because each file's activation takes one of the two device slots, and
    // after `serial` for the same reason `serial` is after the viewports —
    // these specs seed and spend the seeded tenant's stock, turnos and caja.
    // The fixture-era branch specs still run in the viewport projects behind
    // the demo flag until each is converted here, and the flag dies with the
    // last of them.
    {
      name: 'operador',
      dependencies: ['serial'],
      testMatch:
        /operador-(shell|inicio|turno|avisos|inventario|pendientes|gastos|caja|ventas|cobranza|cliente|cierre|detalle-venta|chaos)\.spec\.ts/,
      workers: 1,
      use: { ...DESKTOP },
    },
    // Device slots, counted (B-12). After `operador`, never beside it: each
    // operador file's door revokes a slot and takes it again, and a count taken
    // in that window saw a free slot the plan did not have (ADR-102's first
    // run).
    {
      name: 'devices',
      dependencies: ['operador'],
      testMatch: /devices\.spec\.ts/,
      workers: 1,
      use: { ...DESKTOP },
    },
    // Phones pushing and pulling against the demo business. Last of all, so
    // activating phones and rewriting Taquería's rows cannot race the specs
    // that read them — devices.spec above all, which counts slots.
    {
      name: 'sync',
      dependencies: ['devices'],
      testMatch: /sync\.spec\.ts/,
      // One file at a time: each activates phones on Taquería, which has two
      // device slots, and revokes the previous file's.
      workers: 1,
      use: { ...devices['Desktop Chrome'], storageState: OWNER_STORAGE },
    },
  ],
});
