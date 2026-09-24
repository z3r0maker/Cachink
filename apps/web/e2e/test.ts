import { test as base } from '@playwright/test';

import { coverageEnabled } from '../scripts/coverage-gate/options';
import { addPageCoverage } from './coverage';
import { recordWorkerCoverage } from './worker-coverage';

/**
 * Every spec imports `test` from here, not from `@playwright/test` (ADR-102).
 *
 * With `XG_COVERAGE=1` each test's page — and every Web Worker it starts,
 * where the register's data layer runs — records V8 coverage from its first
 * navigation to its last, and hands it to the E2E coverage stage. Chromium
 * only — the one browser that exposes it. Without the variable this is
 * Playwright's own `test`, untouched: no extra fixture, no extra page.
 */
const withCoverage = base.extend<{ pageCoverage: void }>({
  pageCoverage: [
    async ({ page, browserName }, use) => {
      if (browserName !== 'chromium') return use();
      const takeWorkers = await recordWorkerCoverage(page);
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      await use();
      // A test that closed its own page took the coverage with it.
      if (page.isClosed()) return;
      await addPageCoverage([...(await takeWorkers()), ...(await page.coverage.stopJSCoverage())]);
    },
    { auto: true },
  ],
});

// Everything else (`expect`, the types, `webkit`) is Playwright's own; the
// named `test` below shadows the star export.
export * from '@playwright/test';
export const test = coverageEnabled ? (withCoverage as unknown as typeof base) : base;
