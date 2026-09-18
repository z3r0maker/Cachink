import assert from 'node:assert/strict';
import { getRounds } from 'bcryptjs';
import { describe, it } from 'vitest';

import {
  AuthCoreError,
  BCRYPT_COST,
  DUMMY_HASH,
  hashPassword,
  verifyPassword,
} from '../src/index.js';

describe('hashPassword', () => {
  it('hashes with bcrypt at cost 10, like the portal and the seed', async () => {
    const h = await hashPassword('correcto caballo batería');
    assert.match(h, /^\$2[aby]\$10\$/);
    assert.equal(getRounds(h), BCRYPT_COST);
  });

  it('salts: the same password never hashes the same twice', async () => {
    assert.notEqual(await hashPassword('otra-vez'), await hashPassword('otra-vez'));
  });

  it('refuses an empty password', async () => {
    await assert.rejects(hashPassword(''), AuthCoreError);
  });

  it('refuses a password past bcrypt’s 72-byte limit instead of truncating it', async () => {
    await assert.rejects(hashPassword('ñ'.repeat(37)), { code: 'INVALID_ARGUMENT' });
    assert.ok(await hashPassword('a'.repeat(72)));
  });
});

describe('verifyPassword', () => {
  it('accepts the right password', async () => {
    const h = await hashPassword('s3creto-largo');
    assert.equal(await verifyPassword('s3creto-largo', h), true);
  });

  it('refuses a wrong password', async () => {
    const h = await hashPassword('s3creto-largo');
    assert.equal(await verifyPassword('s3creto-larga', h), false);
  });

  it('refuses everything when there is no stored hash, even the dummy’s own preimage', async () => {
    assert.equal(await verifyPassword('anything', null), false);
    assert.equal(await verifyPassword('', null), false);
  });

  it('refuses a malformed stored hash rather than throwing', async () => {
    assert.equal(await verifyPassword('x', 'not-a-hash'), false);
    assert.equal(await verifyPassword('x', ''), false);
  });

  it('refuses an empty password against a real hash', async () => {
    assert.equal(await verifyPassword('', DUMMY_HASH), false);
  });

  it('pays for a bcrypt comparison on a miss, so an unknown account costs the same', async () => {
    const h = await hashPassword('medida');
    const time = async (stored: string | null) => {
      const t0 = performance.now();
      await verifyPassword('medida-no', stored);
      return performance.now() - t0;
    };
    const [real, missing] = [await time(h), await time(null)];
    assert.ok(missing > real / 4, `miss ${missing}ms vs hit ${real}ms`);
  });
});

describe('DUMMY_HASH', () => {
  it('is a well-formed cost-10 bcrypt hash', () => {
    assert.equal(getRounds(DUMMY_HASH), BCRYPT_COST);
    assert.equal(DUMMY_HASH.length, 60);
  });
});
