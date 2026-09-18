import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'vitest';

import {
  AuthCoreError,
  generateRecoveryCodes,
  hashRecoveryCode,
  looksLikeRecoveryCode,
  matchRecoveryCode,
  normalizeRecoveryCode,
  RECOVERY_CODE_COUNT,
} from '../src/index.js';

describe('generateRecoveryCodes', () => {
  it('makes ten distinct codes of 80 bits, shown in groups of four', () => {
    const { codes, hashes } = generateRecoveryCodes();
    assert.equal(codes.length, RECOVERY_CODE_COUNT);
    assert.equal(RECOVERY_CODE_COUNT, 10);
    assert.equal(new Set(codes).size, 10);
    for (const c of codes) assert.match(c, /^[a-z2-7]{4}(-[a-z2-7]{4}){3}$/);
    assert.equal(hashes.length, 10);
  });

  it('pairs each code with its SHA-256, and stores no code in clear', () => {
    const { codes, hashes } = generateRecoveryCodes();
    codes.forEach((c, i) => assert.equal(hashes[i], hashRecoveryCode(c)));
    for (const h of hashes) assert.match(h, /^[0-9a-f]{64}$/);
  });

  it('refuses a count below 1 or above 50', () => {
    assert.throws(() => generateRecoveryCodes(0), AuthCoreError);
    assert.throws(() => generateRecoveryCodes(51), AuthCoreError);
  });

  it('refuses a fractional count', () => {
    assert.throws(() => generateRecoveryCodes(2.5), AuthCoreError);
  });
});

describe('normalizeRecoveryCode / hashRecoveryCode', () => {
  it('ignores case, dashes and spaces', () => {
    assert.equal(normalizeRecoveryCode(' abcd-efgh ijkl-mnop '), 'ABCDEFGHIJKLMNOP');
    assert.equal(hashRecoveryCode('abcd-efgh-ijkl-mnop'), hashRecoveryCode('ABCDEFGHIJKLMNOP'));
  });

  it('hashes the normalized form with SHA-256', () => {
    const expected = createHash('sha256').update('ABCDEFGHIJKLMNOP').digest('hex');
    assert.equal(hashRecoveryCode('abcd-efgh-ijkl-mnop'), expected);
  });

  it('refuses the wrong length', () => {
    assert.equal(normalizeRecoveryCode('abcd-efgh-ijkl'), null);
    assert.equal(hashRecoveryCode('abcd-efgh-ijkl-mnopq'), null);
  });

  it('refuses characters outside base32 — including a 6-digit TOTP code', () => {
    assert.equal(looksLikeRecoveryCode('abcd-efgh-ijkl-mno1'), false);
    assert.equal(looksLikeRecoveryCode('123456'), false);
    assert.equal(looksLikeRecoveryCode('abcd-efgh-ijkl-mnop'), true);
  });
});

describe('matchRecoveryCode', () => {
  const { codes, hashes } = generateRecoveryCodes();

  it('returns the stored hash a code matches', () => {
    assert.equal(matchRecoveryCode(codes[3] ?? '', hashes), hashes[3]);
  });

  it('matches however the code was typed', () => {
    assert.equal(
      matchRecoveryCode((codes[0] ?? '').toUpperCase().replace(/-/g, ' '), hashes),
      hashes[0],
    );
  });

  it('returns null for a code-shaped value that is not in the set', () => {
    assert.equal(matchRecoveryCode('aaaa-aaaa-aaaa-aaaa', hashes), null);
  });

  it('returns null for junk and for an empty set', () => {
    assert.equal(matchRecoveryCode('nope', hashes), null);
    assert.equal(matchRecoveryCode(codes[0] ?? '', []), null);
  });

  it('ignores malformed stored entries instead of throwing', () => {
    assert.equal(matchRecoveryCode(codes[0] ?? '', ['zz', '']), null);
  });
});
