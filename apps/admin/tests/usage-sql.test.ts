import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

/**
 * No Postgres in this package's unit run, so the migrations are checked as
 * text. 0006 keeps the console's column grants; 0009 replaced its counting
 * body with a call to data-pg's `xangarro.usage_counts()`, whose rules are
 * tested there against `computeUsage` on real Postgres
 * (packages/data-pg/tests/usage-counts*.test.ts).
 */
const raw = readFileSync(
  new URL('../src/server/db/migrations/0006_admin_usage_read.sql', import.meta.url),
  'utf8',
);
const code = raw.replace(/--.*$/gm, '');

describe('0006_admin_usage_read.sql', () => {
  it('grants only SELECT, only to the console, and only the columns the count needs', () => {
    const grants = [...code.matchAll(/GRANT (\w+) (\([^)]*\) )?ON public\.(\w+) TO (\w+)/g)];
    assert.deepEqual(
      grants.map((g) => [g[1], g[2]?.trim(), g[3], g[4]]),
      [
        ['SELECT', '(business_id, created_at)', 'sales', 'xangarro_admin'],
        ['SELECT', '(business_id, created_at)', 'expenses', 'xangarro_admin'],
        [
          'SELECT',
          '(business_id, created_at, motivo, nota)',
          'inventory_movements',
          'xangarro_admin',
        ],
        ['SELECT', '(business_id, created_at, deleted_at)', 'products', 'xangarro_admin'],
      ],
    );
    assert.doesNotMatch(code, /GRANT (INSERT|UPDATE|DELETE|ALL)/);
    assert.doesNotMatch(code, /FOR (ALL|INSERT|UPDATE|DELETE)/);
  });

  it('lets only the console execute the function, as itself', () => {
    assert.match(code, /SECURITY INVOKER/);
    assert.doesNotMatch(code, /SECURITY DEFINER/);
    assert.match(code, /REVOKE ALL ON FUNCTION public\.admin_tenant_usage\([^)]*\) FROM PUBLIC/);
    assert.match(
      code,
      /REVOKE ALL ON FUNCTION public\.admin_tenant_usage\([^)]*\)\s+FROM xangarro_app/,
    );
    const exec = [...code.matchAll(/GRANT EXECUTE ON FUNCTION [^;]* TO (\w+)/g)].map((m) => m[1]);
    assert.deepEqual(exec, ['xangarro_admin']);
  });

  it('0009 keeps the page and delegates every count to xangarro.usage_counts()', () => {
    const shared = readFileSync(
      new URL('../src/server/db/migrations/0009_admin_usage_shared_count.sql', import.meta.url),
      'utf8',
    ).replace(/--.*$/gm, '');
    assert.match(shared, /CREATE OR REPLACE FUNCTION public\.admin_tenant_usage\(/);
    assert.match(shared, /FROM xangarro\.usage_counts\(/);
    assert.match(shared, /SECURITY INVOKER/);
    // The OQ-5 rules live in data-pg's 0010 only (one definition).
    for (const table of ['sales', 'expenses', 'inventory_movements', 'products']) {
      assert.doesNotMatch(shared, new RegExp(`public\\.${table}\\b`));
    }
    const exec = [...shared.matchAll(/GRANT EXECUTE ON FUNCTION [^;]* TO (\w+)/g)].map((m) => m[1]);
    assert.deepEqual(exec, ['xangarro_admin']);
  });
});
