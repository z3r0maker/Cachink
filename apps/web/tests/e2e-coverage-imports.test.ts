import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, it } from 'vitest';

/**
 * ADR-102: a spec that takes `test` from `@playwright/test` still passes, and
 * silently stops recording browser coverage — the number drifts down for no
 * visible reason. Every spec takes it from `e2e/test.ts` instead.
 *
 * A test rather than an ESLint rule: `pnpm lint` runs from `apps/web` with
 * `--config ../../eslint.config.js`, and a `files` glob there resolves against
 * the working directory, so an `apps/web/e2e/**` rule would never match.
 */

const E2E = path.resolve(import.meta.dirname, '../e2e');
const PLAYWRIGHT_TEST = /import\s*\{([^}]*)\}\s*from\s*'@playwright\/test'/g;

function importsPlaywrightTest(source: string): boolean {
  return [...source.matchAll(PLAYWRIGHT_TEST)].some(([, names]) =>
    (names ?? '').split(',').some((n) => n.trim() === 'test'),
  );
}

describe('E2E specs record coverage (ADR-102)', () => {
  it('no spec or helper takes `test` from @playwright/test', () => {
    const offenders = readdirSync(E2E)
      .filter((f) => f.endsWith('.ts') && f !== 'test.ts')
      .filter((f) => importsPlaywrightTest(readFileSync(path.join(E2E, f), 'utf8')));
    assert.deepEqual(offenders, [], `import { test } from './test' in: ${offenders.join(', ')}`);
  });

  it('the check itself catches the import it guards against', () => {
    assert.equal(importsPlaywrightTest("import { expect, test } from '@playwright/test';"), true);
    assert.equal(importsPlaywrightTest("import { type Page } from '@playwright/test';"), false);
    assert.equal(importsPlaywrightTest("import { expect, test } from './test';"), false);
    assert.equal(importsPlaywrightTest("import { testInfo } from '@playwright/test';"), false);
  });
});
