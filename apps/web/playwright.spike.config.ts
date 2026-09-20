import { defineConfig, devices } from '@playwright/test';

/**
 * O-02 spike-only runner (ADR-071 §4). One project; the spec launches
 * Chromium itself and a persistent-context WebKit (headless WebKit's OPFS
 * needs a real data dir). No portal server, no database.
 */
export default defineConfig({
  testMatch: /spike-sqlite-wasm\.spec\.ts/,
  timeout: 90_000,
  outputDir: '/tmp/pw-spike-out',
  projects: [{ name: 'spike', use: { ...devices['Desktop Chrome'] } }],
});
