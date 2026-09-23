import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

/**
 * `xangarro.geo_counters` holds the only location data the product keeps
 * (N-55, ADR-092). The properties asserted here are the ones the *aviso de
 * privacidad* claims, so they are checked as text rather than left to review:
 * no table privilege for anyone, no DELETE, no per-event columns, and a
 * function surface that cannot be widened by a stray grant.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (file: string): string =>
  readFileSync(join(HERE, '..', 'drizzle', file), 'utf8').replace(/--.*$/gm, '');

const table = read('0030_geo_counters.sql');
const grants = read('0031_geo_grants.sql');
const both = `${table}\n${grants}`;

describe('0030_geo_counters.sql', () => {
  it('stores no column that could identify a visit', () => {
    const columns = /CREATE TABLE IF NOT EXISTS xangarro\.geo_counters \(([\s\S]*?)\n\);/.exec(
      table,
    );
    assert.ok(columns !== null, 'the table definition must be findable');
    for (const forbidden of ['ip', 'city', 'ciudad', 'user_id', 'agent', 'lat', 'lon', 'token']) {
      assert.doesNotMatch(columns[1]!, new RegExp(`\\b${forbidden}\\b`, 'i'));
    }
    // A timestamp would reintroduce exactly what the daily bucket removes.
    assert.doesNotMatch(columns[1]!, /timestamptz|timestamp\b/i);
  });

  it('pins search_path on the writer, like every definer function in this schema', () => {
    assert.match(table, /SECURITY DEFINER\s+SET search_path = pg_catalog/);
  });

  it('computes the day itself, so no caller can backdate a row', () => {
    assert.match(table, /now\(\) AT TIME ZONE 'America\/Mexico_City'/);
    assert.doesNotMatch(table, /p_day/);
  });

  it('constrains the source instead of trusting the caller', () => {
    assert.match(table, /CHECK \(source IN \('login', 'compra', 'landing'\)\)/);
    assert.match(table, /RAISE EXCEPTION 'unknown geo source/);
  });
});

describe('0031_geo_grants.sql', () => {
  it('grants no table privilege to anyone — the function is the whole surface', () => {
    assert.doesNotMatch(grants, /GRANT\s+(SELECT|INSERT|UPDATE|ALL)[^;]*ON\s+xangarro\.geo_counters/i);
  });

  it('never grants DELETE, to any role, in either file', () => {
    assert.doesNotMatch(both, /GRANT[^;]*\bDELETE\b/i);
  });

  it('revokes from PUBLIC and forces row level security with no policy', () => {
    assert.match(both, /REVOKE ALL ON xangarro\.geo_counters FROM PUBLIC/);
    assert.match(grants, /FORCE ROW LEVEL SECURITY/);
    assert.doesNotMatch(grants, /CREATE POLICY/i);
  });

  it('lets only the two writer roles execute geo_record', () => {
    const grantees = [...grants.matchAll(/GRANT EXECUTE ON FUNCTION xangarro\.geo_record\([^)]*\) TO (\w+)/g)]
      .map((m) => m[1])
      .sort();
    assert.deepEqual(grantees, ['xangarro_app', 'xangarro_billing']);
  });

  it('does not let the console write what it reads', () => {
    assert.doesNotMatch(grants, /geo_record[^;]*TO xangarro_admin/);
  });
});
