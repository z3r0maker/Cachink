import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'vitest';

import { AuthCoreError, hashToken, isPlausibleToken, mintToken } from '../src/index.js';

describe('mintToken', () => {
  it('is 256 bits as 43 base64url characters', () => {
    const t = mintToken();
    assert.match(t, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(Buffer.from(t, 'base64url').length, 32);
  });

  it('never repeats', () => {
    assert.equal(new Set(Array.from({ length: 200 }, mintToken)).size, 200);
  });
});

describe('hashToken', () => {
  it('is the hex SHA-256 the portal stores', () => {
    const t = mintToken();
    assert.equal(hashToken(t), createHash('sha256').update(t).digest('hex'));
  });

  it('differs for different tokens', () => {
    assert.notEqual(hashToken('a'), hashToken('b'));
  });

  it('refuses an empty token', () => {
    assert.throws(() => hashToken(''), AuthCoreError);
  });
});

describe('isPlausibleToken', () => {
  it('accepts a minted token', () => {
    assert.equal(isPlausibleToken(mintToken()), true);
  });

  it('refuses missing values', () => {
    assert.equal(isPlausibleToken(undefined), false);
    assert.equal(isPlausibleToken(null), false);
    assert.equal(isPlausibleToken(''), false);
  });

  it('refuses the wrong length', () => {
    assert.equal(isPlausibleToken(mintToken().slice(1)), false);
    assert.equal(isPlausibleToken(`${mintToken()}A`), false);
  });

  it('refuses characters outside base64url', () => {
    assert.equal(isPlausibleToken(`${mintToken().slice(1)}+`), false);
  });
});
