/**
 * Proves the layer boundaries (CLAUDE.md §2.5, §4) actually fire.
 *
 * For months they did not. `pnpm lint` was green while a domain file could
 * import `@xangarro/application`: the boundaries plugin could not resolve
 * workspace imports, filed them as external packages, and checked nothing.
 * Separately, each package lints with `eslint . --config ../../eslint.config.js`,
 * and ESLint resolved path-scoped `files` globs against that package's
 * directory, so `packages/ui/src/components/**` matched nothing from
 * `packages/ui`. A rule that never fires looks exactly like a rule that passes.
 *
 * So these tests lint fixtures that break a rule, from the directories the real
 * `lint` scripts run in, and assert the error. The fixtures are passed as text
 * with a file path, so nothing is written to the tree.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { ESLint } from 'eslint';
import { beforeAll, describe, it } from 'vitest';

const REPO = resolve(import.meta.dirname, '..');

/** Same budget as lint-coverage: the first lint loads every plugin. */
const CONFIG_LOAD_TIMEOUT_MS = 180_000;

/**
 * An ESLint that runs the way `pnpm --filter <pkg> lint` does: from the
 * package directory, with the config file its `lint` script names.
 */
function eslintAsPackageLint(pkgDir: string): ESLint {
  const manifest = JSON.parse(readFileSync(join(REPO, pkgDir, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const script = manifest.scripts?.lint ?? '';
  const config = /--config\s+(\S+)/.exec(script)?.[1];
  assert.ok(config, `${pkgDir}'s lint script no longer names a --config: "${script}"`);
  const cwd = join(REPO, pkgDir);
  return new ESLint({ cwd, overrideConfigFile: resolve(cwd, config) });
}

async function ruleIds(eslint: ESLint, file: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: join(REPO, file) });
  assert.ok(result, `no lint result for ${file}`);
  return result.messages.map((m) => m.ruleId ?? `(fatal) ${m.message}`);
}

const DOMAIN_LEAK = `import { computeEntitlement } from '@xangarro/application';
export const leak = computeEntitlement;
`;

describe('layer boundaries', () => {
  let fromRoot: ESLint;
  let fromDomain: ESLint;

  beforeAll(async () => {
    fromRoot = new ESLint({ cwd: REPO, overrideConfigFile: join(REPO, 'eslint.config.js') });
    fromDomain = eslintAsPackageLint('packages/domain');
    // Load the config once under the wide budget; the tests below reuse it.
    await Promise.all(
      [fromRoot, fromDomain].map((e) => e.lintText('', { filePath: join(REPO, 'x.ts') })),
    );
  }, CONFIG_LOAD_TIMEOUT_MS);

  it('rejects domain importing application, from the repo root', async () => {
    const ids = await ruleIds(fromRoot, 'packages/domain/src/zz-boundary.ts', DOMAIN_LEAK);
    assert.ok(ids.includes('boundaries/dependencies'), `got ${JSON.stringify(ids)}`);
  });

  it("rejects it from the package's own lint too", async () => {
    const ids = await ruleIds(fromDomain, 'packages/domain/src/zz-boundary.ts', DOMAIN_LEAK);
    assert.ok(ids.includes('boundaries/dependencies'), `got ${JSON.stringify(ids)}`);
  });

  it('allows an import the table permits', async () => {
    const ids = await ruleIds(
      fromRoot,
      'packages/application/src/zz-boundary.ts',
      `import { PLAN_IDS } from '@xangarro/domain';\nexport const ids = PLAN_IDS;\n`,
    );
    assert.deepEqual(ids, []);
  });

  it('lets application take repository types from data, but not values', async () => {
    const file = 'packages/application/src/zz-boundary.ts';
    const asType = await ruleIds(
      fromRoot,
      file,
      `import type { SalesRepository } from '@xangarro/data';\nexport type R = SalesRepository;\n`,
    );
    assert.deepEqual(asType, []);

    const asValue = await ruleIds(
      fromRoot,
      file,
      `import { DrizzleSalesRepository } from '@xangarro/data';\nexport const r = DrizzleSalesRepository;\n`,
    );
    assert.ok(asValue.includes('boundaries/dependencies'), `got ${JSON.stringify(asValue)}`);
  });
});

describe('path-scoped rules', () => {
  it(
    "fire from the package's own lint",
    async () => {
      const eslint = eslintAsPackageLint('packages/ui');
      const ids = await ruleIds(
        eslint,
        'packages/ui/src/components/Zz/zz.ts',
        `import { Card } from '../index';\nexport const card = Card;\n`,
      );
      assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
    },
    CONFIG_LOAD_TIMEOUT_MS,
  );
});
