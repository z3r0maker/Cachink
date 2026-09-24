import MCR, { CDPClient, type CoverageReportOptions } from 'monocart-coverage-reports';

import { E2E_DIR, INSPECT_PORT, rawStage } from '../scripts/coverage-gate/options';

/**
 * The E2E half of the portal's coverage (ADR-102). Two sources, one raw dir:
 * the browser's V8 data per test (`addPageCoverage`, via `./test`) and the
 * `next start` process's, written once at the end (`addServerCoverageAndWrite`, from
 * the global teardown). Both only when `XG_COVERAGE=1`.
 */

/** Built chunks only: browser bundles, and the server's — not Node or node_modules. */
const SERVER_CHUNK = /\/\.next(-e2e\/\d+)?\/server\//;

function e2eOptions(): CoverageReportOptions {
  return {
    ...rawStage('Portal — E2E', E2E_DIR),
    entryFilter: (entry) => entry.url.includes('/_next/static/') || SERVER_CHUNK.test(entry.url),
  };
}

/** Page coverage as Playwright returns it, or a worker's in the same shape. */
type PageCoverage = readonly { url: string; source?: string; functions: readonly unknown[] }[];

/** Workers add concurrently; MCR keeps each call in its cache until `generate`. */
export async function addPageCoverage(coverage: PageCoverage): Promise<void> {
  await MCR(e2eOptions()).add(coverage);
}

/**
 * Asks the server to flush its V8 data over the inspector, adds it, and writes
 * the raw report `merge.ts` reads. A server this run did not start has no
 * inspector — most often a reused dev server — and that is an error, not a
 * silently browser-only number.
 */
export async function addServerCoverageAndWrite(): Promise<void> {
  const client = await CDPClient({ port: INSPECT_PORT });
  if (client === undefined) {
    throw new Error(
      `No inspector on port ${INSPECT_PORT}: the portal server was not started by this ` +
        'coverage run. Stop whatever holds E2E_PORT and run `pnpm test:e2e:coverage`.',
    );
  }
  const dir = await client.writeCoverage();
  await client.close();
  const mcr = MCR(e2eOptions());
  await mcr.addFromDir(dir);
  await mcr.generate();
}
