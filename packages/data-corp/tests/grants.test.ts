import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

/**
 * The corp migration set's privilege rules, checked as text so no database is
 * needed (ADR-124 §2): no login or password in a migration, no DELETE for any
 * role, nothing for PUBLIC, and no reach into another schema.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = join(HERE, '..', 'drizzle');
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql'));
/** Comments and string literals out: the rules are about SQL, not about seeded text. */
const strip = (sql: string): string => sql.replace(/--.*$/gm, '').replace(/'(?:[^']|'')*'/g, "''");
const all = files.map((f) => strip(readFileSync(join(DIR, f), 'utf8'))).join('\n');

describe('drizzle/ (the corp set)', () => {
  it('has a grants file next to the generated schema', () => {
    assert.ok(
      files.some((f) => f.includes('grants')),
      files.join(', '),
    );
  });

  it('never creates a login or ships a password', () => {
    assert.doesNotMatch(all, /\bLOGIN\b|\bPASSWORD\b/i);
  });

  it('never grants DELETE to anyone', () => {
    assert.doesNotMatch(all, /GRANT[^;]*\bDELETE\b/i);
  });

  it('revokes everything from PUBLIC on the schema', () => {
    assert.match(all, /REVOKE ALL ON SCHEMA corp FROM PUBLIC/i);
  });

  it('touches no schema but corp', () => {
    const qualified = [...all.matchAll(/\b(public|xangarro|auth)\.\w+/gi)].map((m) => m[0]);
    assert.deepEqual(qualified, []);
  });
});
