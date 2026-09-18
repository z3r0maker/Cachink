import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { PLATFORM_FLAG_KEYS, PLATFORM_FLAG_MODES, MAX_ALLOWLIST } from '@xangarro/domain';

import { platformFlagEvents } from '@/server/db/flag-schema';

/**
 * Checked as text against the Drizzle table and the domain, as for 0003. The
 * SQL was also applied to a scratch Postgres during N-09 (see the commit):
 * the portal role could read only the narrow view, only its own business in
 * an allowlist, and the console could not UPDATE or DELETE an event.
 */
const sql = readFileSync(
  new URL('../src/server/db/migrations/0005_platform_flags.sql', import.meta.url),
  'utf8',
);
const code = sql.replace(/--.*$/gm, '');

const createTable = code.slice(code.indexOf('CREATE TABLE'), code.indexOf('CONSTRAINT'));
const sqlColumns = [...createTable.matchAll(/^ {2}([a-z_]+)\s+(text|timestamptz)/gm)]
  .map((m) => m[1])
  .sort();

describe('0005_platform_flags.sql', () => {
  it('declares exactly the columns the Drizzle table maps', () => {
    const drizzleColumns = getTableConfig(platformFlagEvents)
      .columns.map((c) => c.name)
      .sort();
    assert.deepEqual(sqlColumns, drizzleColumns);
  });

  it('checks the same keys, modes and list bound as the domain', () => {
    const keys = /flag_key IN\s*\(([^)]*)\)/.exec(code)?.[1] ?? '';
    assert.deepEqual(
      [...keys.matchAll(/'(\w+)'/g)].map((m) => m[1]),
      [...PLATFORM_FLAG_KEYS],
    );
    for (const m of PLATFORM_FLAG_MODES) assert.ok(code.includes(`'${m}'`), m);
    assert.match(code, new RegExp(`cardinality\\(allowlist_business_ids\\) <= ${MAX_ALLOWLIST}`));
    assert.match(code, /\(mode = 'allowlist'\) = \(cardinality\(allowlist_business_ids\) > 0\)/);
  });

  it('current state is a view over append-only events: no UPDATE, no DELETE', () => {
    assert.match(
      code,
      /CREATE OR REPLACE VIEW public\.platform_flags AS\s+SELECT DISTINCT ON \(flag_key\)/,
    );
    assert.match(code, /ORDER BY flag_key, updated_at DESC, id DESC/);
    assert.match(code, /GRANT SELECT, INSERT ON public\.platform_flag_events TO xangarro_admin/);
    assert.doesNotMatch(code, /UPDATE|DELETE|FOR ALL/);
  });

  it('the portal reads one narrow view and nothing else', () => {
    const appGrants = [...code.matchAll(/GRANT ([A-Z, ]+) ON ([\w.]+) TO xangarro_app/g)];
    assert.deepEqual(
      appGrants.map((g) => [g[1], g[2]]),
      [['SELECT', 'public.platform_flags_for_entitlement']],
    );
    assert.match(code, /REVOKE ALL ON public\.platform_flag_events FROM xangarro_app/);
    assert.match(code, /REVOKE ALL ON public\.platform_flags FROM xangarro_app/);
    const view = code.slice(code.indexOf('platform_flags_for_entitlement'));
    assert.doesNotMatch(view.slice(0, view.indexOf(';')), /reason|updated_by/);
    assert.match(view, /xangarro\.current_business_id\(\) = ANY \(allowlist_business_ids\)/);
  });
});
