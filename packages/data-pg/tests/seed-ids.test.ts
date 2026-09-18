import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

/**
 * Every id the seed mints is a valid ULID.
 *
 * Crockford base32 excludes I, L, O and U, and a readable mnemonic keeps
 * reaching for exactly those letters. It happened four times in one day: seed
 * product ids with U, I and O (`PQUE1`, `PGRI1`, `PHOR1`), a portal sentinel
 * with an L, and a conformance user with a U (`CNFU1`). Postgres stores any of
 * them happily — ids are `text` — and the failure surfaces only when something
 * finally validates against the domain.
 *
 * This reads the seed source rather than the database, so it runs in the plain
 * unit suite with no Docker, and catches the mistake the moment it is typed
 * rather than at the next integration run. `seed-contract.integration.test.ts`
 * is the complementary check against what actually landed.
 */
const SEED = join(import.meta.dirname, '../scripts/seed-data.ts');
const CROCKFORD_SUFFIX = /^[0-9A-HJKMNP-TV-Z]{5}$/;

describe('seed ids', () => {
  it('mints only Crockford base32 ULID suffixes', () => {
    const src = readFileSync(SEED, 'utf8');
    const suffixes = [...src.matchAll(/\bid\('([^']*)'\)/g)].map((m) => m[1] ?? '');

    assert.ok(suffixes.length > 40, `expected the seed's ids, found ${suffixes.length}`);

    const bad = [...new Set(suffixes.filter((s) => !CROCKFORD_SUFFIX.test(s)))];
    assert.deepEqual(
      bad,
      [],
      `${bad.length} seed id suffix(es) are not Crockford base32: ${bad.join(', ')}\n` +
        'The alphabet excludes I, L, O and U — the letters a mnemonic reaches for.',
    );
  });

  it('keeps the fixed prefix at 21 characters, so every id is 26', () => {
    const src = readFileSync(SEED, 'utf8');
    const prefix = /ULID_PREFIX = '([^']+)'/.exec(src)?.[1] ?? '';
    assert.equal(prefix.length, 21);
    assert.match(prefix, /^[0-9A-HJKMNP-TV-Z]+$/);
  });
});
