/**
 * Playwright config for `apps/desktop` integration / multi-window E2E
 * (Slice 8 M4-C15).
 *
 * Unlike `packages/ui/playwright.config.ts` (which builds Storybook
 * for visual snapshots), these specs assume a real Tauri desktop +
 * two Expo web tabs are already running. They're integration scaffolds
 * for human-driven manual QA — see `SETUP.md` "Manual QA" section.
 *
 * Usage:
 *
 *   # Terminal 1 — start the desktop app
 *   pnpm --filter @cachink/desktop dev
 *
 *   # Terminal 2/3 — start two mobile web tabs
 *   pnpm --filter @cachink/mobile web
 *
 *   # Terminal 4 — drive the specs
 *   pnpm --filter @cachink/desktop test:e2e   # all specs
 *   pnpm --filter @cachink/desktop test:lan   # LAN specs only
 *   pnpm --filter @cachink/desktop test:cloud # cloud specs only
 */
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './playwright',
  testMatch: /.*\.spec\.ts$/,
  timeout: 30_000,
  use: {
    baseURL: process.env.CACHINK_DESKTOP_URL ?? 'http://localhost:1420',
    trace: 'on-first-retry',
  },
  // Intentionally NO `webServer` block — these specs require manual
  // setup of `tauri dev` + two mobile web tabs (see header comment).
  // Spawning them here would compete with the developer's own
  // dev-server lifecycle.
  reporter: process.env.CI ? 'github' : 'list',
});
