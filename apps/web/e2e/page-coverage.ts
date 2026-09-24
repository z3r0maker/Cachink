import type { Page } from '@playwright/test';

/**
 * The page's own V8 coverage, over CDP rather than `page.coverage` (ADR-102).
 *
 * Coverage lives with the document, so it is taken the moment a navigation is
 * requested, several times per test. `page.coverage` cannot restart cleanly
 * mid-test; this takes only the counters (`Profiler.takePreciseCoverage`, which also resets
 * them, so successive takes add up) and fetches each chunk's source once, at
 * the end, from the server that served it.
 */

type Functions = readonly unknown[];
interface Taken {
  readonly url: string;
  readonly functions: Functions;
}
export interface PageEntry extends Taken {
  readonly source: string;
}

/** The app's own bundles; the page also runs Chrome's and extensions' scripts. */
const APP_CHUNK = '/_next/static/';

export interface PageRecorder {
  /** The counters since the last take; recording goes on. */
  readonly take: () => Promise<void>;
  /** Every take, each with its chunk's source; recording ends. */
  readonly finish: () => Promise<PageEntry[]>;
}

export async function recordPageCoverage(page: Page): Promise<PageRecorder> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
  const taken: Taken[] = [];

  const take = async () => {
    const { result } = (await cdp.send('Profiler.takePreciseCoverage')) as {
      result: { url: string; functions: Functions }[];
    };
    for (const r of result)
      if (r.url.includes(APP_CHUNK)) taken.push({ url: r.url, functions: r.functions });
  };

  const finish = async () => {
    if (!page.isClosed()) await take().catch(() => undefined);
    await cdp.detach().catch(() => undefined);
    const sources = new Map<string, Promise<string>>();
    const sourceOf = (url: string) => {
      if (!sources.has(url))
        sources.set(
          url,
          page.request.get(url).then((r) => r.text()),
        );
      return sources.get(url) as Promise<string>;
    };
    return Promise.all(taken.map(async (t) => ({ ...t, source: await sourceOf(t.url) })));
  };

  return { take, finish };
}
