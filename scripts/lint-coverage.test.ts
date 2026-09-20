/**
 * Guards the thing that actually went wrong in F-08: lint *coverage*, not lint
 * *cleanliness*.
 *
 * `pnpm lint` was green for months while `scripts/`, each package's own
 * `scripts/` directory, `apps/web/e2e/` and `packages/ui/.storybook/` were
 * never linted at all —
 * `turbo run lint` only runs per-package tasks, and each task named its own
 * directories by hand. Six real errors sat in that hole until a pre-commit hook
 * happened to stage the files. A linter you believe covers the repo, but does
 * not, is worse than no linter: it launders unchecked code as checked.
 *
 * So this file asserts the *set of files under lint*, from the real config:
 *   1. every tracked `.ts`/`.tsx` is linted, or explicitly ignored;
 *   2. the ignore list has not grown to swallow actual source, which is how a
 *      failure of (1) would otherwise be "fixed".
 *
 * Both read `eslint.config.js` and the real `package.json` scripts, so they
 * cannot drift from what CI runs.
 */

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { ESLint } from 'eslint';
import { describe, it } from 'vitest';

const REPO = resolve(import.meta.dirname, '..');

function readJson(path: string): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(path, 'utf8')) as { scripts?: Record<string, string> };
}

function trackedSources(): readonly string[] {
  const out = execFileSync('git', ['ls-files', '*.ts', '*.tsx'], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return out.split('\n').filter((f) => f.length > 0);
}

/** `apps/*` and `packages/*`, per pnpm-workspace.yaml. */
function workspaceDirs(): readonly string[] {
  return ['apps', 'packages'].flatMap((parent) => {
    const dir = join(REPO, parent);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => `${parent}/${e.name}`);
  });
}

/**
 * Directories some `lint` task actually reaches.
 *
 * Every workspace package now lints itself with a bare `eslint .`, so declaring
 * a `lint` script covers the whole package directory — no glob to forget. The
 * root `lint:root` script covers what is not a workspace at all.
 */
function lintRoots(): readonly string[] {
  const roots = workspaceDirs().filter((dir) => {
    const manifest = join(REPO, dir, 'package.json');
    return existsSync(manifest) && readJson(manifest).scripts?.lint !== undefined;
  });

  const rootScript = readJson(join(REPO, 'package.json')).scripts?.['lint:root'] ?? '';
  const extra: string[] = [];
  for (const token of rootScript.split(/\s+/).slice(1)) {
    if (token.startsWith('-')) break;
    // The script quotes globs so the shell hands them to ESLint intact.
    extra.push(token.replace(/^['"]|['"]$/g, ''));
  }
  return [...roots, ...extra];
}

/** A root is a directory prefix, or — when it contains `*` — a glob. */
function covers(root: string, file: string): boolean {
  if (!root.includes('*')) return file === root || file.startsWith(`${root}/`);
  // `**` and `*` are translated in one pass. A two-pass replace needs a
  // placeholder, and prettier rewrites an escaped one into a literal control
  // character in the source.
  const pattern = root
    .replace(/[.+^${}()|[\]\\]/g, (c) => `\\${c}`)
    .replace(/\*\*|\*/g, (m) => (m === '**' ? '.*' : '[^/]*'));
  return new RegExp(`^${pattern}$`).test(file);
}

describe('lint coverage', () => {
  // ESLint's config engine spins up per file; cold runs cross the 5 s default
  // (CI runners are slower still) — the coverage answer is what matters, not
  // the stopwatch.
  it(
    'lints every tracked TypeScript file, or ignores it on purpose',
    { timeout: 90_000 },
    async () => {
      const eslint = new ESLint({ cwd: REPO, overrideConfigFile: join(REPO, 'eslint.config.js') });
      const roots = lintRoots();

      const uncovered: string[] = [];
      for (const file of trackedSources()) {
        if (await eslint.isPathIgnored(file)) continue;
        if (roots.some((root) => covers(root, file))) continue;
        uncovered.push(file);
      }

      assert.deepEqual(
        uncovered,
        [],
        `${uncovered.length} tracked file(s) are linted by nothing:\n` +
          `${uncovered.map((f) => `  ${f}`).join('\n')}\n\n` +
          'Either add the directory to the root `lint:root` script, give its ' +
          'package a `lint` script, or add it to `ignores` in ' +
          'packages/config/eslint.config.js with a comment saying why.',
      );
    },
  );

  it('does not ignore its way to a green result', async () => {
    // The cheap way to satisfy the test above is to widen `ignores` until the
    // offending files disappear. Source directories are the thing that must
    // never be ignorable, so they are asserted directly.
    const eslint = new ESLint({ cwd: REPO, overrideConfigFile: join(REPO, 'eslint.config.js') });
    // `.d.ts` are ambient declarations with nothing to lint, and are ignored
    // globally on purpose.
    const sources = trackedSources().filter(
      (f) => /^(apps|packages)\/[^/]+\/src\//.test(f) && !f.endsWith('.d.ts'),
    );

    assert.ok(sources.length > 500, `expected the repo's source tree, found ${sources.length}`);

    const ignored: string[] = [];
    for (const file of sources) {
      if (await eslint.isPathIgnored(file)) ignored.push(file);
    }

    assert.deepEqual(
      ignored,
      [],
      `${ignored.length} source file(s) are excluded from lint entirely:\n` +
        `${ignored
          .slice(0, 20)
          .map((f) => `  ${f}`)
          .join('\n')}`,
    );
  });
});
