import { test as base, type Page } from '@playwright/test';

import { coverageEnabled } from '../scripts/coverage-gate/options';
import { addPageCoverage } from './coverage';
import { recordPageCoverage } from './page-coverage';
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
  await waitForPageHydration(page);
}

/**
 * The page under the portal's loading boundary hydrates on its own schedule.
 *
 * `(portal)/loading.tsx` (DonCargando, ADR-107) wraps every page in a Suspense
 * boundary, and React hydrates a boundary after the root: the route announcer
 * is there while the page's form is still inert, and a fill in that window is
 * reset when the boundary hydrates — `/saldos-iniciales` answered «Revisa
 * estos datos: fechaApertura» and `/inventario-inicial` dropped its .csv that
 * way. React attaches a `__reactFiber$…` key to every element it hydrates, so
 * the page is live once the loading screen is gone and every element in `main`
 * carries one. Best effort, like
 * the announcer: a page with no `main` passes at once, and after ten seconds
 * (a cold dev-server compile) the wait gives up quietly.
 */
async function waitForPageHydration(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        // Still on DonCargando: the page has not even arrived.
        if (document.querySelector('[data-cargando]') !== null) return false;
        const nodes = Array.from(document.querySelectorAll('main, main *'));
        return nodes.every((n) => Object.keys(n).some((k) => k.startsWith('__reactFiber$')));
      },
      undefined,
      { timeout: 10_000 },
    )
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
 * V8's coverage lives with the document: a full navigation throws away what
 * ran on the page before it. Most specs navigate after acting, and the app
 * itself navigates too — a redirect after signup, a link, a form post. So the
 * page's coverage (and its workers') is taken before every navigation the test
 * makes, and as each document the app navigates to is *requested* — the old
 * document is alive until the response commits, and a take is milliseconds
 * against a server-rendered page's tens, though it can lose (ADR-102).
 *
 * The `request` event, not `page.route`: CDP calls made inside a route handler
 * wait on the navigation that handler is holding, and never return. Nothing
 * here pauses anything. Client-side App Router navigations keep the document
 * and need none of this.
 */
async function recordPage(page: Page): Promise<() => Promise<void>> {
  const pages = await recordPageCoverage(page);
  const workers = await recordWorkerCoverage(page);
  const workerTakes: Awaited<ReturnType<typeof workers.take>>[] = [];
  const pending: Promise<void>[] = [];
  const take = async () => {
    workerTakes.push(await workers.take());
    await pages.take();
  };
  // The test's own navigations: taken before they start — exact.
  let byTest = false;
  for (const method of ['goto', 'reload', 'goBack', 'goForward'] as const) {
    const navigate = page[method].bind(page) as (...args: unknown[]) => Promise<unknown>;
    (page as unknown as Record<string, unknown>)[method] = async (...args: unknown[]) => {
      await take();
      byTest = true;
      try {
        return await navigate(...args);
      } finally {
        byTest = false;
      }
    };
  }
  // The app's own (a redirect, a link, a form): taken as the document is
  // requested — best effort, it races the response.
  page.on('request', (request) => {
    if (!byTest && request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      pending.push(take().catch(() => undefined));
    }
  });
  return async () => {
    await Promise.all(pending);
    // A test that closed its own page took its last document with it; what was
    // taken at earlier navigations is still handed over.
    if (!page.isClosed()) workerTakes.push(await workers.take());
    await workers.stop();
    await addPageCoverage([...workerTakes.flat(), ...(await pages.finish())]);
  };
}

const withCoverage = hydrated.extend<{ pageCoverage: void }>({
  pageCoverage: [
    async ({ page, browserName }, use) => {
      if (browserName !== 'chromium') return use();
      const flush = await recordPage(page);
      await use();
      await flush();
    },
    { auto: true },
  ],
});

// Everything else (`expect`, the types, `webkit`) is Playwright's own; the
// named `test` below shadows the star export.
export * from '@playwright/test';
export const test = coverageEnabled ? (withCoverage as unknown as typeof base) : hydrated;
