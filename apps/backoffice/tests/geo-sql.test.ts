import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

/**
 * The console's half of the geo feature (N-56), asserted as text the way
 * `usage-sql.test.ts` asserts 0006.
 *
 * The property worth failing CI over: the console reads an aggregate and
 * nothing else. It holds no grant on `xangarro.geo_counters` — verified
 * against real Postgres, where `xangarro_admin` gets "permission denied for
 * table geo_counters" — so no screen, and no query someone adds later, can
 * reconstruct a single day's visit from a small state.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', 'src', 'server', 'db', 'migrations');
const sql = readFileSync(join(MIGRATIONS, '0015_admin_geo_read.sql'), 'utf8').replace(
  /--.*$/gm,
  '',
);

describe('0015_admin_geo_read.sql', () => {
  it('is a STABLE definer function with a pinned search_path', () => {
    assert.match(sql, /STABLE/);
    assert.match(sql, /SECURITY DEFINER/);
    assert.match(sql, /SET search_path = pg_catalog/);
  });

  it('returns counts, never rows', () => {
    assert.match(sql, /RETURNS TABLE \(source text, country text, region text, hits bigint\)/);
    assert.match(sql, /GROUP BY/);
    assert.doesNotMatch(sql, /\bday\b\s*,/, 'a per-day column would undo the aggregate');
  });

  it('grants execute to the console role and nobody else', () => {
    const grantees = [...sql.matchAll(/GRANT EXECUTE ON FUNCTION[^;]*TO (\w+)/g)].map((m) => m[1]);
    assert.deepEqual(grantees, ['xangarro_admin']);
    assert.match(sql, /REVOKE ALL ON FUNCTION[^;]*FROM PUBLIC/);
  });

  it('never writes', () => {
    for (const verb of ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE']) {
      assert.doesNotMatch(sql, new RegExp(`\\b${verb}\\b`, 'i'));
    }
  });

  it('takes no grant on the counter table itself', () => {
    assert.doesNotMatch(sql, /GRANT[^;]*ON\s+xangarro\.geo_counters/i);
  });
});

describe('the mapa route', () => {
  const dir = join(HERE, '..', 'src', 'app', '(consola)', 'mapa');
  /** Comments explain *why* inline styles are banned, so they are stripped first. */
  const strip = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const sources = readdirSync(dir).map((f) => strip(readFileSync(join(dir, f), 'utf8')));

  it('uses no inline style attribute, which the CSP would drop', () => {
    // ui.css.ts:86 — style-src has no 'unsafe-inline', so a server-rendered
    // style="" never reaches the browser. Colour must come from a class.
    for (const source of sources) assert.doesNotMatch(source, /style=\{\{|style="/);
  });

  it('ships no client component: the page is readable with JavaScript off', () => {
    for (const source of sources) assert.doesNotMatch(source, /'use client'/);
  });
});
