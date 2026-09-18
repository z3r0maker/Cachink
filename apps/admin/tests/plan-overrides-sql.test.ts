import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';

import { PLAN_OVERRIDE_KINDS } from '@xangarro/domain';

import { planOverrides } from '@/server/db/override-schema';

/**
 * No Postgres in this package's unit run, so the migrations are checked as
 * text against the Drizzle table and the domain (as for support_items). The
 * SQL was also applied to a scratch Postgres 17 during N-06: grants denied
 * UPDATE/DELETE on plan_overrides, writes on tenant tables, auth.users
 * columns beyond id/email, and any portal read of plan_overrides.
 */
const read = (name: string) =>
  readFileSync(new URL(`../src/server/db/migrations/${name}`, import.meta.url), 'utf8');
const sql = read('0003_plan_overrides.sql');
const code = sql.replace(/--.*$/gm, '');
const read4 = read('0004_admin_tenant_read.sql').replace(/--.*$/gm, '');

const createTable = sql.slice(sql.indexOf('CREATE TABLE'), sql.indexOf('CONSTRAINT'));
const sqlColumns = [...createTable.matchAll(/^ {2}([a-z_]+)\s+(text|integer|timestamptz)/gm)]
  .map((m) => m[1])
  .sort();

describe('0003_plan_overrides.sql', () => {
  it('declares exactly the columns the Drizzle table maps', () => {
    const drizzleColumns = getTableConfig(planOverrides)
      .columns.map((c) => c.name)
      .sort();
    assert.deepEqual(sqlColumns, drizzleColumns);
  });

  it('checks the same kinds as the domain, and only paid plans can be comped', () => {
    for (const k of PLAN_OVERRIDE_KINDS) assert.ok(sql.includes(`'${k}'`), k);
    assert.match(sql, /plan_id IN \('xangarro', 'xangarrote'\)/);
    assert.match(sql, /days BETWEEN 1 AND 90/);
  });

  it('requires an expiry for extend and comp, after creation', () => {
    assert.match(sql, /kind = 'extend_trial' AND days IS NOT NULL[\s\S]*?expires_at IS NOT NULL/);
    assert.match(sql, /kind = 'comp_plan' AND days IS NULL[\s\S]*?expires_at IS NOT NULL/);
    assert.match(sql, /expires_at IS NULL OR expires_at > created_at/);
  });

  it('is append-only for the console and closed to the portal', () => {
    const grants = [...code.matchAll(/GRANT ([A-Z, ]+) ON public\.plan_overrides TO (\w+)/g)];
    assert.deepEqual(
      grants.map((g) => [g[1], g[2]]),
      [['SELECT, INSERT', 'xangarro_admin']],
    );
    assert.doesNotMatch(code, /UPDATE|DELETE/);
    assert.match(code, /REVOKE ALL ON public\.plan_overrides FROM xangarro_app/);
    assert.match(code, /FORCE ROW LEVEL SECURITY/);
  });
});

describe('0004_admin_tenant_read.sql', () => {
  it('grants the console SELECT only, on exactly the three tables N-06 reads', () => {
    assert.match(read4, /ARRAY\['businesses', 'business_members', 'devices'\]/);
    assert.match(read4, /GRANT SELECT ON public\.%I TO xangarro_admin/);
    assert.match(read4, /FOR SELECT TO xangarro_admin USING \(true\)/);
    assert.doesNotMatch(read4, /INSERT|UPDATE|DELETE|FOR ALL/);
  });

  it('reads auth.users by column: id and email, never the password hash', () => {
    assert.match(read4, /GRANT SELECT \(id, email\) ON auth\.users TO xangarro_admin/);
    assert.doesNotMatch(read4, /encrypted_password/);
  });
});
