/**
 * plan-board.ts — regenerate `docs/plan/PENDIENTES.md`, the one place to read
 * what is still open across every plan track.
 *
 * The track files stay the source of truth (`00-README.md` §3); this only
 * collects their checkbox lines and the owner-action rows of
 * `11-pre-launch-and-deferred.md`. `plan-board.test.ts` fails when the
 * committed board no longer matches the tracks, so it cannot go stale
 * silently.
 *
 * Usage: `pnpm plan:board` (writes) · `pnpm plan:board --check` (exit 1 when stale).
 * Parsing is `plan-board-parse.ts`; the three-list layout is `plan-board-render.ts`.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Item, parseTrack } from './plan-board-parse.js';
import { renderBoard } from './plan-board-render.js';

export { renderBoard };

export const BOARD = 'docs/plan/PENDIENTES.md';

/** Files outside `docs/plan` that carry checkbox work. `launch-checklist.md` is pre-rebrand and stale; X-10 rewrites it. */
const EXTRA_SOURCES = ['docs/launch/production-readiness.md'] as const;
const SKIP = new Set(['00-README.md', basename(BOARD)]);

export function collect(root: string): Item[] {
  const planDir = join(root, 'docs/plan');
  const planFiles = readdirSync(planDir)
    .filter((f) => f.endsWith('.md') && !SKIP.has(f))
    .sort()
    .map((f) => join(planDir, f));
  const files = [...planFiles, ...EXTRA_SOURCES.map((f) => join(root, f))];
  return files.flatMap((file) => {
    const source = relative(join(root, 'docs/plan'), file);
    return parseTrack(source, readFileSync(file, 'utf8'));
  });
}

function main(argv: readonly string[]): number {
  const root = join(fileURLToPath(import.meta.url), '../..');
  const target = join(root, BOARD);
  const next = renderBoard(collect(root));
  if (argv.includes('--check')) {
    const current = readFileSync(target, 'utf8');
    if (current === next) return 0;
    process.stderr.write(`${BOARD} is stale — run pnpm plan:board\n`);
    return 1;
  }
  writeFileSync(target, next);
  process.stdout.write(`wrote ${BOARD}\n`);
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
