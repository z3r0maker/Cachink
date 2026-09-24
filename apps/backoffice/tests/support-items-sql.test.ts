import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { SUPPORT_KINDS, SUPPORT_STATUSES, CFDI_UUID_REGEX } from '@xangarro/domain';

import { supportItems } from '@/server/db/support-schema';

/**
 * No Postgres in this package's unit run, so the migration is checked against
 * the Drizzle table and the domain as text: the two descriptions of
 * `support_items` cannot drift apart, and the grants stay as ADR-063 wants.
 */
// 0002 created the table; 0011 widened the kinds CHECK for `ayuda`; 0019
// added `arco` and its `due_at` (N-34). The rules are asserted over the set,
// like data-pg's usage-counts-sql test.
const migration = (name: string) =>
  readFileSync(new URL(`../src/server/db/migrations/${name}`, import.meta.url), 'utf8');
const sql = ['0002_support_items.sql', '0011_support_ayuda.sql', '0019_support_arco.sql']
  .map(migration)
  .join('\n');
/** The statements only: comments may say "no DELETE" without granting it. */
const code = sql.replace(/--.*$/gm, '');
const createTable = sql.slice(sql.indexOf('CREATE TABLE'), sql.indexOf(');') + 2);
const created = [...createTable.matchAll(/^ {2}([a-z_]+)\s+(text|boolean|jsonb|timestamptz)/gm)];
const added = [...sql.matchAll(/ADD COLUMN IF NOT EXISTS ([a-z_]+) /g)];
const sqlColumns = [...created, ...added].map((m) => m[1]).sort();

describe('0002_support_items.sql', () => {
  it('declares exactly the columns the Drizzle table maps', () => {
    const drizzleColumns = getTableConfig(supportItems)
      .columns.map((c) => c.name)
      .sort();
    assert.deepEqual(sqlColumns, drizzleColumns);
  });

  it('keys idempotency on (source, source_ref)', () => {
    assert.match(sql, /UNIQUE \(source, source_ref\)/);
  });

  it('indexes the inbox list and the per-business lookup', () => {
    assert.match(sql, /support_items \(status, kind, created_at DESC, id DESC\)/);
    assert.match(sql, /support_items \(business_id\)/);
  });

  it('checks the same kinds, statuses and UUID shape as the domain', () => {
    for (const k of SUPPORT_KINDS) assert.ok(sql.includes(`'${k}'`), k);
    for (const s of SUPPORT_STATUSES) assert.ok(sql.includes(`'${s}'`), s);
    assert.ok(sql.includes(CFDI_UUID_REGEX.source), 'cfdi_uuid pattern');
  });

  it('ties due_at to the arco kind, as the domain does', () => {
    assert.match(sql, /CHECK \(\(kind = 'arco'\) = \(due_at IS NOT NULL\)\)/);
  });

  it('grants the admin role read/insert/update but never DELETE, and shuts the portal out', () => {
    const grants = [...sql.matchAll(/GRANT ([A-Z, ]+) ON public\.support_items TO (\w+)/g)];
    assert.deepEqual(
      grants.map((g) => [g[1], g[2]]),
      [['SELECT, INSERT, UPDATE', 'xangarro_admin']],
    );
    assert.doesNotMatch(code, /DELETE/);
    assert.match(sql, /REVOKE ALL ON public\.support_items FROM xangarro_app/);
    assert.match(sql, /FORCE ROW LEVEL SECURITY/);
  });
});
