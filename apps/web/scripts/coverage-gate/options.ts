import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import type { CoverageReportOptions } from 'monocart-coverage-reports';
import ts from 'typescript';

/**
 * One definition of "the portal's code" for every coverage run (ADR-102).
 *
 * The unit suite (Vitest), the browser half of the E2E suite (Playwright's
 * page coverage) and its server half (`next start` under NODE_V8_COVERAGE)
 * each emit raw V8 data; `merge.ts` folds them into one number. They only
 * merge correctly if all three name a file the same way and agree on what
 * counts, which is what this module is for.
 */

export const WEB_ROOT = path.resolve(import.meta.dirname, '../..');
export const COVERAGE_DIR = path.join(WEB_ROOT, 'coverage');
export const UNIT_DIR = path.join(COVERAGE_DIR, 'unit');
export const E2E_DIR = path.join(COVERAGE_DIR, 'e2e');
export const MERGED_DIR = path.join(COVERAGE_DIR, 'merged');
/** Where `next start` writes its V8 data when the teardown asks for it. */
export const SERVER_V8_DIR = path.join(E2E_DIR, 'v8-server');

/** Set by `test:e2e:coverage` and by the coverage build; off everywhere else. */
export const coverageEnabled = process.env.XG_COVERAGE === '1';

/** The inspector port of the coverage server. Off the default 9229 on purpose. */
export const INSPECT_PORT = Number(process.env.XG_INSPECT_PORT ?? 9331);

/**
 * Every spelling a portal file arrives in, reduced to `src/…`. MCR has already
 * dropped the `webpack://` scheme, so the client bundle gives `_N_E/src/…` and
 * the server bundle `xangarro/web/src/…`; untested files come as absolute
 * paths and Vitest's as `src/…`. Anything else — a shared package's
 * `packages/domain/src/…`, Next's own `src/client/…` — keeps its spelling and
 * fails `isPortalSource`.
 */
const PORTAL_FILE = /^(?:.*\/apps\/web\/|_N_E\/|xangarro\/(?:apps\/)?web\/)?(src\/.*)$/;

export function toSourcePath(filePath: string): string {
  const bare = filePath.replace(/\\/g, '/').split('?')[0] ?? '';
  return PORTAL_FILE.exec(bare)?.[1] ?? bare;
}

const onDisk = new Map<string, boolean>();

/**
 * The one directory left out by name: `/inventario` and `/inventario/operador`
 * are development galleries of the UI primitives (Fase 1 compuerta, Track O),
 * reviewed against the design by eye, never shown to a user — `e2e/routes.ts`
 * leaves them out for the same reason. Anything else that wants out needs an
 * ADR, not a line here (ADR-102).
 */
const DEV_SCAFFOLDING = 'src/app/inventario/';

/**
 * What counts: files under `src/` that exist — a library's source map can
 * name its own `src/…`, and only the disk tells the two apart. The shared
 * packages keep their own gates. Style modules (`*.css.ts`) compile to CSS at
 * build time and never execute, so they would sit at 0% whatever the tests did.
 */
export function isPortalSource(sourcePath: string): boolean {
  if (!/^src\/.*\.tsx?$/.test(sourcePath) || /\.(css|d)\.ts$/.test(sourcePath)) return false;
  if (sourcePath.startsWith(DEV_SCAFFOLDING)) return false;
  let exists = onDisk.get(sourcePath);
  if (exists === undefined) {
    exists = existsSync(path.join(WEB_ROOT, sourcePath));
    onDisk.set(sourcePath, exists);
  }
  return exists;
}

/** Untested files still count, at 0%. TypeScript is transpiled so they parse. */
async function transpile(entry: { url: string; source: string; sourceMap?: unknown }) {
  const fileName = entry.url.replace(/^file:\/\//, '');
  const source = entry.source || (await readFile(fileName, 'utf8'));
  const out = ts.transpileModule(source, {
    fileName,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      sourceMap: true,
      inlineSources: true,
    },
  });
  entry.source = out.outputText;
  if (out.sourceMapText === undefined) return;
  // transpileModule names the source by its basename; the filter needs `src/…`.
  entry.sourceMap = { ...JSON.parse(out.sourceMapText), sources: [fileName] };
}

export const ALL_FILES: NonNullable<CoverageReportOptions['all']> = {
  dir: [path.join(WEB_ROOT, 'src')],
  filter: {
    '**/*.css.ts': false,
    '**/src/app/inventario/**': false,
    '**/*.d.ts': false,
    '**/*.{ts,tsx}': true,
    '**/*': false,
  },
  transformer: transpile,
};

/** The options every stage shares; each adds its own name, dir and reports. */
export const sharedOptions = {
  sourcePath: (filePath: string) => toSourcePath(filePath),
  sourceFilter: (sourcePath: string) => isPortalSource(toSourcePath(sourcePath)),
} satisfies CoverageReportOptions;

/** Raw data only: stages write it, `merge.ts` reads it. */
export function rawStage(name: string, outputDir: string): CoverageReportOptions {
  return { ...sharedOptions, name, outputDir, reports: [['raw', { outputDir: 'raw' }]] };
}
