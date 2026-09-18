import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { classifyMovementOrigin, DEFAULT_USAGE_TIME_ZONE } from '@xangarro/domain/usage';

/**
 * No Postgres in this package's unit run, so 0005 is checked as text against
 * the domain rules it mirrors. It was also applied to a scratch Postgres
 * during N-07 and its counts compared with `computeUsage` over the same rows
 * (see the N-07 progress note).
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

  it('places rows in months by the domain’s time zone', () => {
    assert.ok(code.includes(`AT TIME ZONE '${DEFAULT_USAGE_TIME_ZONE}'`));
  });

  it('excludes exactly the movements classifyMovementOrigin does not call manual', () => {
    assert.match(code, /im\.motivo NOT IN \('Venta', 'Conversión'\)/);
    assert.match(code, /im\.motivo = 'Devolución de cliente'/);
    assert.match(code, /starts_with\(coalesce\(im\.nota, ''\), 'Cancelación de venta:'\)/);
    assert.equal(classifyMovementOrigin({ motivo: 'Venta' }), 'venta');
    assert.equal(classifyMovementOrigin({ motivo: 'Conversión' }), 'conversion');
    const cancel = { motivo: 'Devolución de cliente', nota: 'Cancelación de venta: V-1' };
    assert.equal(classifyMovementOrigin(cancel), 'cancelacion');
    assert.equal(classifyMovementOrigin({ motivo: 'Devolución de cliente' }), 'manual');
  });

  it('does not un-count soft-deleted transactions', () => {
    const tx = code.slice(code.indexOf('tx AS ('), code.indexOf('tx_n AS ('));
    assert.doesNotMatch(tx, /deleted_at/);
  });
});
