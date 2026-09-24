import { test as base, type Page } from '@playwright/test';

import { coverageEnabled } from '../scripts/coverage-gate/options';
import { addPageCoverage } from './coverage';
import { recordWorkerCoverage } from './worker-coverage';

/**
 * Every spec imports `test` from here, not from `@playwright/test` (ADR-102).
 *
 * Two things live on top of Playwright's own `test`. Every run gets the
 * hydration wait below (ADR-103). With `XG_COVERAGE=1` each test's page — and
 * every Web Worker it starts, where the register's data layer runs — also
 * records V8 coverage from its first navigation to its last, and hands it to the
 * E2E coverage stage; Chromium only, the one browser that exposes it, and
 * without the variable that fixture is not installed at all.
 */

/**
 * Every navigation waits for hydration (ADR-103).
 *
 * `goto` resolves on `load`, which is the HTML and the bundles — not React
 * having attached to them. A click that lands in the gap is dropped (the
 * control is visible, enabled, even takes focus, and nothing is listening) and
 * a `fill` is worse: it writes the DOM, the state behind it stays empty, and
 * the re-render at hydration puts the empty value back. Both cost this suite
 * whole runs, in a different spec each time.
 *
 * `next-route-announcer` is the App Router's own element: created client-side,
 * in an effect, so it is never in the server's HTML and its presence means the
 * root tree hydrated (measured: ~90 ms after commit). Best effort — a page that
 * is not the app (a failed navigation, a download) simply has none, and after
 * three seconds the wait gives up quietly rather than failing an honest test or
 * charging every navigation for the miss.
 *
 * `interact.ts` still retries the interaction itself: a page Suspense can
 * resolve after the root, and a spec's own `context.newPage()` never sees this
 * fixture.
 */
async function waitForHydration(page: Page): Promise<void> {
  await page
    .locator('next-route-announcer')
    .waitFor({ state: 'attached', timeout: 3_000 })
    .catch(() => undefined);
}

const hydrated = base.extend({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      await waitForHydration(page);
      return response;
    };
    await use(page);
  },
});

/**
 * V8's coverage lives with the document: a full navigation or reload throws
 * away what ran on the page before it, and most specs navigate after acting —
 * to check the result somewhere else. So coverage is collected just before
 * every `goto` / `reload` / `goBack` / `goForward`, then restarted (ADR-102).
 * Client-side App Router navigations keep the document and need nothing.
 */
const NAVIGATIONS = ['goto', 'reload', 'goBack', 'goForward'] as const;

async function recordPage(page: Page): Promise<() => Promise<void>> {
  let takeWorkers = await recordWorkerCoverage(page);
  await page.coverage.startJSCoverage({ resetOnNavigation: false });
  const flush = async () => {
    await addPageCoverage([...(await takeWorkers()), ...(await page.coverage.stopJSCoverage())]);
  };
  for (const method of NAVIGATIONS) {
    const navigate = page[method].bind(page) as (...args: unknown[]) => Promise<unknown>;
    (page as unknown as Record<string, unknown>)[method] = async (...args: unknown[]) => {
      await flush();
      takeWorkers = await recordWorkerCoverage(page);
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
      return navigate(...args);
    };
  }
  return flush;
}

const withCoverage = hydrated.extend<{ pageCoverage: void }>({
  pageCoverage: [
    async ({ page, browserName }, use) => {
      if (browserName !== 'chromium') return use();
      const flush = await recordPage(page);
      await use();
      // A test that closed its own page took the coverage with it.
      if (!page.isClosed()) await flush();
    },
    { auto: true },
  ],
});

// Everything else (`expect`, the types, `webkit`) is Playwright's own; the
// named `test` below shadows the star export.
export * from '@playwright/test';
export const test = coverageEnabled ? (withCoverage as unknown as typeof base) : hydrated;
