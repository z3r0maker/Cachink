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
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  use: { baseURL: 'http://localhost:3100' },
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
