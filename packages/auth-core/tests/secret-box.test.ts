import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { describe, it } from 'vitest';

import { AuthCoreError, openSecret, parseSecretKey, sealSecret } from '../src/index.js';

const key = randomBytes(32);
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

describe('parseSecretKey', () => {
  it('reads 32 bytes of base64 (openssl rand -base64 32)', () => {
    assert.deepEqual(parseSecretKey(key.toString('base64')), key);
  });

  it('reads base64url too, and ignores surrounding whitespace', () => {
    assert.deepEqual(parseSecretKey(` ${key.toString('base64url')}\n`), key);
  });

  it('refuses a missing key', () => {
    assert.throws(() => parseSecretKey(undefined), { code: 'INVALID_KEY' });
    assert.throws(() => parseSecretKey(''), { code: 'INVALID_KEY' });
  });

  it('refuses a key of the wrong length', () => {
    assert.throws(() => parseSecretKey(randomBytes(16).toString('base64')), AuthCoreError);
    assert.throws(() => parseSecretKey(randomBytes(33).toString('base64')), AuthCoreError);
  });
});

describe('sealSecret / openSecret', () => {
  it('round-trips', () => {
    assert.equal(openSecret(key, sealSecret(key, SECRET, 'staff-1'), 'staff-1'), SECRET);
  });

  it('never writes the plaintext, and never seals the same way twice', () => {
    const a = sealSecret(key, SECRET, 'staff-1');
    assert.doesNotMatch(a, new RegExp(SECRET));
    assert.match(a, /^v1\.[\w-]+\.[\w-]+\.[\w-]+$/);
    assert.notEqual(a, sealSecret(key, SECRET, 'staff-1'));
  });

  it('refuses the wrong key', () => {
    const sealed = sealSecret(key, SECRET, 'staff-1');
    assert.throws(() => openSecret(randomBytes(32), sealed, 'staff-1'), {
      code: 'INVALID_SEALED_SECRET',
    });
  });

  it('refuses a value moved to another owner (context is authenticated)', () => {
    const sealed = sealSecret(key, SECRET, 'staff-1');
    assert.throws(() => openSecret(key, sealed, 'staff-2'), { code: 'INVALID_SEALED_SECRET' });
  });

  it('refuses a tampered ciphertext', () => {
    const [v, iv, body, tag] = sealSecret(key, SECRET, 'c').split('.');
    const flipped = Buffer.from(body ?? '', 'base64url');
    flipped[0] = (flipped[0] ?? 0) ^ 1;
    const bad = [v, iv, flipped.toString('base64url'), tag].join('.');
    assert.throws(() => openSecret(key, bad, 'c'), AuthCoreError);
  });

  it('refuses malformed values', () => {
    for (const bad of ['', 'v1', 'v2.a.b.c', 'v1.a.b.c', 'v1.a.b.c.d']) {
      assert.throws(() => openSecret(key, bad, 'c'), { code: 'INVALID_SEALED_SECRET' }, bad);
    }
  });

  it('refuses a key of the wrong length on either side', () => {
    assert.throws(() => sealSecret(randomBytes(16), SECRET, 'c'), { code: 'INVALID_KEY' });
    assert.throws(() => openSecret(randomBytes(16), 'v1.a.b.c', 'c'), { code: 'INVALID_KEY' });
  });
});
