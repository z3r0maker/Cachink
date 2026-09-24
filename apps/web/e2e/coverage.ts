import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import MCR, { CDPClient, type CoverageReportOptions } from 'monocart-coverage-reports';

import {
  E2E_DIR,
  INSPECT_PORT,
  isPortalSource,
  rawStage,
  toSourcePath,
} from '../scripts/coverage-gate/options';
import { splitDuplicatedCopies, type ScriptCoverage, type V8Function } from './coverage-split';

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
  await mcr.add(await serverScripts(dir));
  await mcr.generate();
}

const counted = (sourceName: string) => isPortalSource(toSourcePath(sourceName));

/**
 * Node's coverage files, read here rather than by `addFromDir`, so each built
 * chunk goes through `splitDuplicatedCopies` with its source and map attached:
 * a page chunk holds a module once per webpack layer, and only one copy runs.
 */
async function serverScripts(dir: string): Promise<ScriptCoverage[]> {
  const scripts: ScriptCoverage[] = [];
  for (const name of (await readdir(dir)).filter((n) => n.endsWith('.json'))) {
    const raw = JSON.parse(await readFile(path.join(dir, name), 'utf8')) as {
      readonly result: readonly { readonly url: string; readonly functions: V8Function[] }[];
    };
    for (const { url, functions } of raw.result.filter((r) => SERVER_CHUNK.test(r.url))) {
      const file = fileURLToPath(url);
      const source = await readFile(file, 'utf8');
      const sourceMap = existsSync(`${file}.map`)
        ? JSON.parse(await readFile(`${file}.map`, 'utf8'))
        : undefined;
      scripts.push(...splitDuplicatedCopies({ url, source, sourceMap, functions }, counted));
    }
  }
  return scripts;
}
