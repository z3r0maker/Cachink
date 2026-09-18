import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  AuthCoreError,
  base32Encode,
  generateTotpSecret,
  hotp,
  otpauthUri,
  totpCode,
  totpStep,
  verifyTotp,
  type HotpAlgorithm,
} from '../src/index.js';

const SEED_SHA1 = Buffer.from('12345678901234567890');
const SEED_SHA256 = Buffer.from('12345678901234567890123456789012');
const SEED_SHA512 = Buffer.from('1234567890123456789012345678901234567890123456789012345678901234');
const SECRET = base32Encode(SEED_SHA1); // GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ

describe('hotp — RFC 4226 Appendix D', () => {
  const expected = [
    '755224',
    '287082',
    '359152',
    '969429',
    '338314',
    '254676',
    '287922',
    '162583',
    '399871',
    '520489',
  ];
  it('produces every published value for counters 0–9', () => {
    expected.forEach((code, counter) => assert.equal(hotp(SEED_SHA1, counter), code));
  });

  it('refuses a negative or fractional counter', () => {
    assert.throws(() => hotp(SEED_SHA1, -1), AuthCoreError);
    assert.throws(() => hotp(SEED_SHA1, 1.5), AuthCoreError);
  });

  it('refuses a digit count outside 6–10', () => {
    assert.throws(() => hotp(SEED_SHA1, 0, 5), AuthCoreError);
    assert.throws(() => hotp(SEED_SHA1, 0, 11), AuthCoreError);
  });
});

describe('TOTP — RFC 6238 Appendix B (8 digits)', () => {
  const vectors: ReadonlyArray<[number, string, string, string]> = [
    [59, '94287082', '46119246', '90693936'],
    [1111111109, '07081804', '68084774', '25091201'],
    [1111111111, '14050471', '67062674', '99943326'],
    [1234567890, '89005924', '91819424', '93441116'],
    [2000000000, '69279037', '90698825', '38618901'],
    [20000000000, '65353130', '77737706', '47863826'],
  ];
  const seeds: ReadonlyArray<[HotpAlgorithm, Buffer, 1 | 2 | 3]> = [
    ['sha1', SEED_SHA1, 1],
    ['sha256', SEED_SHA256, 2],
    ['sha512', SEED_SHA512, 3],
  ];
  it('matches every published value for SHA-1, SHA-256 and SHA-512', () => {
    for (const row of vectors) {
      const step = totpStep(new Date(row[0] * 1000));
      for (const [algorithm, seed, column] of seeds) {
        assert.equal(hotp(seed, step, 8, algorithm), row[column], `${algorithm} @ ${row[0]}`);
      }
    }
  });

  it('derives the 6-digit code as the last six of the 8-digit one', () => {
    assert.equal(totpCode(SECRET, new Date(59_000)), '287082');
  });
});

describe('verifyTotp', () => {
  const now = new Date(1_234_567_890_000);
  const step = totpStep(now);

  it('accepts the current code and returns its step', () => {
    assert.equal(verifyTotp(SECRET, totpCode(SECRET, now), now), step);
  });

  it('tolerates one step of drift either way, and no more', () => {
    const at = (s: number) => new Date(s * 30_000);
    assert.equal(verifyTotp(SECRET, hotp(SEED_SHA1, step - 1), now), step - 1);
    assert.equal(verifyTotp(SECRET, hotp(SEED_SHA1, step + 1), now), step + 1);
    assert.equal(verifyTotp(SECRET, totpCode(SECRET, at(step - 2)), now), null);
    assert.equal(verifyTotp(SECRET, totpCode(SECRET, at(step + 2)), now), null);
  });

  it('accepts a code typed with a space in the middle', () => {
    const code = totpCode(SECRET, now);
    assert.equal(verifyTotp(SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, now), step);
  });

  it('refuses a wrong code', () => {
    const wrong = String((Number(totpCode(SECRET, now)) + 1) % 1_000_000).padStart(6, '0');
    assert.equal(verifyTotp(SECRET, wrong, now), null);
  });

  it('refuses anything that is not six digits', () => {
    for (const code of ['', '12345', '1234567', 'abcdef', '12 34 5']) {
      assert.equal(verifyTotp(SECRET, code, now), null, code);
    }
  });

  it('refuses a replay of a step already used', () => {
    const code = totpCode(SECRET, now);
    assert.equal(verifyTotp(SECRET, code, now, step), null);
    assert.equal(verifyTotp(SECRET, code, now, step - 1), step);
  });

  it('throws on a secret that is not base32', () => {
    assert.throws(() => verifyTotp('not-base32!', '123456', now), { code: 'INVALID_BASE32' });
    assert.throws(() => verifyTotp('', '123456', now), { code: 'INVALID_ARGUMENT' });
  });
});

describe('generateTotpSecret', () => {
  it('returns 160 bits as 32 base32 characters', () => {
    assert.match(generateTotpSecret(), /^[A-Z2-7]{32}$/);
  });

  it('never repeats', () => {
    const seen = new Set(Array.from({ length: 50 }, generateTotpSecret));
    assert.equal(seen.size, 50);
  });

  it('round-trips through a code', () => {
    const s = generateTotpSecret();
    const now = new Date();
    assert.equal(verifyTotp(s, totpCode(s, now), now), totpStep(now));
  });
});

describe('otpauthUri', () => {
  const input = { secret: SECRET, account: 'ana@xangarro.mx', issuer: 'Xangarro Consola' };

  it('builds the Key Uri Format an authenticator scans', () => {
    const uri = otpauthUri(input);
    assert.ok(uri.startsWith('otpauth://totp/Xangarro%20Consola:ana%40xangarro.mx?'));
    const params = new URL(uri).searchParams;
    assert.equal(params.get('secret'), SECRET);
    assert.equal(params.get('issuer'), 'Xangarro Consola');
    assert.equal(params.get('algorithm'), 'SHA1');
    assert.equal(params.get('digits'), '6');
    assert.equal(params.get('period'), '30');
  });

  it('refuses an empty account or issuer', () => {
    assert.throws(() => otpauthUri({ ...input, account: '' }), AuthCoreError);
    assert.throws(() => otpauthUri({ ...input, issuer: '' }), AuthCoreError);
  });

  it('refuses an issuer containing the label separator', () => {
    assert.throws(() => otpauthUri({ ...input, issuer: 'a:b' }), AuthCoreError);
  });

  it('refuses a secret that is not base32', () => {
    assert.throws(() => otpauthUri({ ...input, secret: 'nope!' }), { code: 'INVALID_BASE32' });
  });
});
