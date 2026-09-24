import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import MCR from 'monocart-coverage-reports';

import { ALL_FILES, E2E_DIR, MERGED_DIR, UNIT_DIR, WEB_ROOT, sharedOptions } from './options';

/**
 * The portal's one coverage number: unit + E2E, merged (ADR-102).
 *
 *   tsx scripts/coverage-gate/merge.ts            # merge, report, hold the floor
 *   tsx scripts/coverage-gate/merge.ts --raise    # …and raise the floor to today
 *   tsx scripts/coverage-gate/merge.ts --report-only  # report, hold nothing
 *
 * The floor is a ratchet, like `.design-lint-baseline.json` in the other
 * direction: it may rise, never fall. A change that lowers coverage fails
 * here; a change that raises it should carry `--raise` in the same commit.
 *
 * `--report-only` is for a run whose E2E step failed: specs that stopped early
 * covered less than they would have, so the number is shown, not judged.
 */

const METRICS = ['lines', 'statements', 'functions', 'branches'] as const;
type Metric = (typeof METRICS)[number];
type Floor = Record<Metric, number> & { target: number };

const FLOOR_FILE = path.join(WEB_ROOT, 'coverage-floor.json');

/** Both stages, or the number means nothing: a unit-only 24% is how this began. */
function inputDirs(): string[] {
  const dirs = [path.join(UNIT_DIR, 'raw'), path.join(E2E_DIR, 'raw')];
  const missing = dirs.filter((d) => !existsSync(d));
  if (missing.length > 0) {
    throw new Error(
      `No raw coverage in ${missing.map((d) => path.relative(WEB_ROOT, d)).join(', ')}.\n` +
        'Run `pnpm test:coverage` and `pnpm test:e2e:coverage` first.',
    );
  }
  return dirs;
}

/** One decimal, floored, so a floor written today holds on a re-run today. */
const pct = (n: number): number => Math.floor(n * 10) / 10;

/**
 * Istanbul's totals, not MCR's V8 ones. V8 "lines" credit every line of a
 * module that merely loaded — its types, its imports, the body of a component
 * whose page rendered once — and read ~35 points above the statements beside
 * them. Istanbul's are what Vitest reports for `domain` and `application`, so
 * the portal's number means what theirs does.
 */
async function measured(): Promise<Record<Metric, number>> {
  const file = path.join(MERGED_DIR, 'coverage-summary.json');
  const { total } = JSON.parse(await readFile(file, 'utf8')) as {
    total: Record<Metric, { pct: number }>;
  };
  return {
    lines: pct(total.lines.pct),
    statements: pct(total.statements.pct),
    functions: pct(total.functions.pct),
    branches: pct(total.branches.pct),
  };
}

function report(floor: Floor, now: Record<Metric, number>): Metric[] {
  const fallen = METRICS.filter((m) => now[m] < floor[m]);
  for (const m of METRICS) {
    const mark = now[m] < floor[m] ? '✗' : '✓';
    console.log(`${mark} ${m.padEnd(10)} ${String(now[m]).padStart(5)}%  floor ${floor[m]}%`);
  }
  console.log(`target ${floor.target}% — floors rise with --raise, never fall.`);
  return fallen;
}

async function main(): Promise<void> {
  await MCR({
    ...sharedOptions,
    name: 'Portal coverage — unit + E2E',
    inputDir: inputDirs(),
    outputDir: MERGED_DIR,
    all: ALL_FILES,
    reports: ['v8', 'lcovonly', 'json-summary', 'text-summary'],
  }).generate();

  const floor = JSON.parse(await readFile(FLOOR_FILE, 'utf8')) as Floor;
  const now = await measured();
  const fallen = report(floor, now);

  if (process.argv.includes('--raise')) {
    const raised = { ...floor };
    for (const m of METRICS) raised[m] = Math.max(floor[m], now[m]);
    await writeFile(FLOOR_FILE, `${JSON.stringify(raised, null, 2)}\n`);
    console.log(`floor raised in ${path.relative(WEB_ROOT, FLOOR_FILE)}`);
  }
  if (fallen.length > 0 && process.argv.includes('--report-only')) {
    console.log(`Below the floor on ${fallen.join(', ')} — not enforced: the E2E run failed.`);
  } else if (fallen.length > 0) {
    console.error(`Coverage fell below the floor on: ${fallen.join(', ')}.`);
    process.exitCode = 1;
  }
}

await main();
