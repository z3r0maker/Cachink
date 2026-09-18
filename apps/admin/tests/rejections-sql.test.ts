import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

/**
 * No Postgres in this package's unit run, so 0007 is checked as text: the
 * console may count rejections across tenants, and nothing more.
 */
const raw = readFileSync(
  new URL('../src/server/db/migrations/0007_admin_sync_rejections_read.sql', import.meta.url),
  'utf8',
);
const code = raw.replace(/--.*$/gm, '');

describe('0007_admin_sync_rejections_read.sql', () => {
  it('grants SELECT on the counted columns only, to the console only', () => {
    const grants = [...code.matchAll(/GRANT (\w+) (\([^)]*\) )?ON public\.(\w+) TO (\w+)/g)];
    assert.deepEqual(
      grants.map((g) => [g[1], g[2]?.trim(), g[3], g[4]]),
      [
        [
          'SELECT',
          '(business_id, code, received_at, resolved_at)',
          'sync_rejections',
          'xangarro_admin',
        ],
      ],
    );
  });

  it('never exposes what the phone tried to send', () => {
    assert.doesNotMatch(code, /payload|message/);
  });

  it('adds a read-only policy and no write of any kind', () => {
    assert.match(
      code,
      /CREATE POLICY admin_read ON public\.sync_rejections FOR SELECT TO xangarro_admin USING \(true\)/,
    );
    assert.doesNotMatch(code, /GRANT (INSERT|UPDATE|DELETE|ALL)/);
    assert.doesNotMatch(code, /FOR (ALL|INSERT|UPDATE|DELETE)/);
    assert.doesNotMatch(code, /xangarro_app/);
  });

  it('is a no-op where the console role does not exist', () => {
    assert.match(code, /IF NOT EXISTS \(SELECT 1 FROM pg_roles WHERE rolname = 'xangarro_admin'\)/);
  });
});
