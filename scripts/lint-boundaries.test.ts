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

const SYNTH_IMPORT = `import * as synth from '@xangarro/synth-core';\nexport const s = synth;\n`;

describe('Synth stays out of the product (ADR-153)', () => {
  let fromWeb: ESLint;
  let fromRoot: ESLint;

  beforeAll(async () => {
    fromWeb = eslintAsPackageLint('apps/web');
    fromRoot = new ESLint({ cwd: REPO, overrideConfigFile: join(REPO, 'eslint.config.js') });
    await Promise.all(
      [fromWeb, fromRoot].map((e) => e.lintText('', { filePath: join(REPO, 'x.ts') })),
    );
  }, CONFIG_LOAD_TIMEOUT_MS);

  it("rejects apps/web importing Synth, from the portal's own lint", async () => {
    const ids = await ruleIds(fromWeb, 'apps/web/src/zz-synth.ts', SYNTH_IMPORT);
    assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
  });

  it('rejects a package the boundaries table does not classify', async () => {
    const ids = await ruleIds(fromRoot, 'packages/data-pg/src/zz-synth.ts', SYNTH_IMPORT);
    assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
  });

  it('rejects a subpath import and a ui component, whose own rule replaces the shared one', async () => {
    const sub = `import { x } from '@xangarro/synth-server/api';\nexport const y = x;\n`;
    const ids = await ruleIds(fromRoot, 'packages/ui/src/components/Zz/zz.ts', sub);
    assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
  });

  it('runs studio → server → core, and never back', async () => {
    const down = await ruleIds(
      fromRoot,
      'tools/synth/server/src/zz.ts',
      `import * as core from '@xangarro/synth-core';\nexport const c = core;\n`,
    );
    assert.deepEqual(down, []);

    const up = await ruleIds(
      fromRoot,
      'tools/synth/core/src/zz.ts',
      `import * as studio from '@xangarro/synth-studio';\nexport const s = studio;\n`,
    );
    assert.ok(up.includes('boundaries/dependencies'), `got ${JSON.stringify(up)}`);
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

describe('consoleMotion stays in the founders’ console (ADR-161 §5)', () => {
  let fromWeb: ESLint;
  let fromBackoffice: ESLint;
  let fromRoot: ESLint;

  beforeAll(async () => {
    fromWeb = eslintAsPackageLint('apps/web');
    fromBackoffice = eslintAsPackageLint('apps/backoffice');
    fromRoot = new ESLint({ cwd: REPO, overrideConfigFile: join(REPO, 'eslint.config.js') });
    await Promise.all(
      [fromWeb, fromBackoffice, fromRoot].map((e) =>
        e.lintText('', { filePath: join(REPO, 'x.ts') }),
      ),
    );
  }, CONFIG_LOAD_TIMEOUT_MS);

  const NAMED = `import { consoleMotion } from '@xangarro/tokens';\nexport const m = consoleMotion;\n`;

  it("rejects apps/web importing it, from the portal's own lint", async () => {
    const ids = await ruleIds(fromWeb, 'apps/web/src/zz-motion.ts', NAMED);
    assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
  });

  it('rejects a namespace import and a re-export too', async () => {
    const star = `import * as tokens from '@xangarro/tokens';\nexport const m = tokens;\n`;
    const reExport = `export { consoleMotion } from '@xangarro/tokens';\n`;
    for (const code of [star, reExport]) {
      const ids = await ruleIds(fromRoot, 'apps/mobile/src/zz-motion.ts', code);
      assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
    }
  });

  it('rejects the phone body, a ui component and Synth Studio', async () => {
    for (const file of [
      'packages/ui/src/zz-motion.ts',
      'packages/ui/src/components/Zz/zz.ts',
      'tools/synth/studio/src/zz-motion.ts',
      'apps/landing/src/zz-motion.ts',
    ]) {
      const ids = await ruleIds(fromRoot, file, NAMED);
      assert.ok(ids.includes('no-restricted-imports'), `${file}: got ${JSON.stringify(ids)}`);
    }
  });

  it('rejects reaching past the package index to its file', async () => {
    const deep = `import { consoleMotion } from '../../../packages/tokens/src/console-motion';\nexport const m = consoleMotion;\n`;
    const ids = await ruleIds(fromRoot, 'apps/web/src/zz/zz-motion.ts', deep);
    assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
  });

  it('lets the backoffice import it, and the portal keep every other token', async () => {
    const inConsole = await ruleIds(fromBackoffice, 'apps/backoffice/src/zz-motion.ts', NAMED);
    assert.deepEqual(inConsole, []);
    const other = `import { consoleTheme } from '@xangarro/tokens';\nexport const t = consoleTheme;\n`;
    assert.deepEqual(await ruleIds(fromWeb, 'apps/web/src/zz-motion.ts', other), []);
  });

  it('still keeps Synth out of the backoffice', async () => {
    const ids = await ruleIds(fromBackoffice, 'apps/backoffice/src/zz-synth.ts', SYNTH_IMPORT);
    assert.ok(ids.includes('no-restricted-imports'), `got ${JSON.stringify(ids)}`);
  });
});
