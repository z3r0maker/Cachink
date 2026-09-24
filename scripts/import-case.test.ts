/**
 * Every relative import must match its file's real spelling, letter for letter.
 *
 * macOS and Windows resolve `Card/Card` to `Card/card.tsx` without complaint.
 * Linux does not. So an import with the wrong case is invisible on every
 * developer's machine — including the pre-push hook — and fails only in CI,
 * where the message is `Failed to resolve import`, as if the file were missing.
 *
 * `packages/ui/tests/a11y.test.tsx` imported `../src/components/Card/Card`
 * against `card.tsx` from 2026-04-27 to 2026-09-24. Five months, on a suite of
 * 234 files, hidden further by turbo's cache: the day the cache missed, the
 * whole `ci` job went red on a single capital letter.
 *
 * Sibling of `./lint-coverage.test.ts` — it reads the real tracked files, so it
 * cannot drift from the tree, and it needs no build, no bundler and no network.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve, sep } from 'node:path';
import { describe, it } from 'vitest';

const REPO = resolve(import.meta.dirname, '..');

/** What a bundler tries, in order, for a relative specifier with no extension. */
const CANDIDATES = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json'] as const;
const INDEX = ['/index.ts', '/index.tsx', '/index.js', '/index.jsx'] as const;

const IMPORT = /(?:from|import)\s*\(?\s*['"](\.[^'"]*)['"]/g;

function sources(): readonly string[] {
  const out = execFileSync('git', ['ls-files', '*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.split('\n').filter((f) => f !== '' && !f.includes('node_modules/'));
}

/** The path as the filesystem really spells it, or undefined if any segment differs. */
function spelledExactly(path: string): boolean {
  let at = REPO;
  for (const segment of relative(REPO, path).split(sep)) {
    let entries: readonly string[];
    try {
      entries = readdirSync(at);
    } catch {
      return false;
    }
    if (!entries.includes(segment)) return false;
    at = join(at, segment);
  }
  return true;
}

/** Resolves like a bundler on a case-insensitive disk, then checks the spelling. */
function offender(file: string, specifier: string): string | undefined {
  const base = normalize(join(REPO, dirname(file), specifier));
  for (const suffix of [...CANDIDATES, ...INDEX]) {
    const candidate = base + suffix;
    if (!existsSync(candidate)) continue;
    // The first hit is what the bundler would take. If its spelling is wrong,
    // this import works here and fails on Linux.
    return spelledExactly(candidate) ? undefined : relative(REPO, candidate);
  }
  // Unresolvable here (a path alias, a generated file, an extensionless
  // directory import into a package): not this test's business.
  return undefined;
}

/**
 * Budget for the sweep. It stats every candidate path of every relative import
 * in ~3,500 tracked files: about 1.5 s idle, measured at 8 s beside a build or
 * another agent's test run — past vitest's 5 s default, which is how this
 * failed once for being slow rather than for finding anything.
 * `lint-coverage.test.ts` carries the same budget for the same reason.
 */
const SWEEP_TIMEOUT_MS = 180_000;

describe('import case', () => {
  it(
    'every relative import matches the file name exactly',
    () => {
      const wrong: string[] = [];
      for (const file of sources()) {
        const text = readFileSync(join(REPO, file), 'utf8');
        for (const [, specifier] of text.matchAll(IMPORT)) {
          if (specifier === undefined) continue;
          const real = offender(file, specifier);
          if (real !== undefined) wrong.push(`${file}: '${specifier}' → ${real}`);
        }
      }
      assert.deepEqual(
        wrong,
        [],
        `These imports resolve on macOS and fail on Linux CI. Match the file's real spelling:\n  ${wrong.join('\n  ')}`,
      );
    },
    SWEEP_TIMEOUT_MS,
  );
});
