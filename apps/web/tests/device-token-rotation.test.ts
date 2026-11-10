import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';
import { SignJWT } from 'jose';

import { mintDeviceToken } from '../src/server/device/credentials';
import { SecretPolicyError } from '../src/server/device/secret-policy';
import {
  DEVICE_TOKEN_AUDIENCE,
  DEVICE_TOKEN_ISSUER,
  LEGACY_AUDIENCE,
  LEGACY_UNTIL,
} from '../src/server/device/token-shape';
import { verifyDeviceToken } from '../src/server/device/verify-token';

/**
 * Rotating `DEVICE_TOKEN_SECRET` without unlinking every phone (audit F-06):
 * the secret being rotated out moves to `DEVICE_TOKEN_SECRET_PREVIOUS`, tokens
 * are minted with the current one only, and a token verifies against the
 * current one and then, if set, the previous one.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0CDEV1';
const CALLER = { businessId: BIZ, deviceId: DEV };

const secret = () => randomBytes(32).toString('base64');
const CURRENT = secret();
const PREVIOUS = secret();
const UNKNOWN = secret();

/** A device token of the current shape, signed with any secret. */
function signedWith(key: string, audience: string = DEVICE_TOKEN_AUDIENCE, iat?: number) {
  const now = iat ?? Math.floor(Date.now() / 1000);
  const jwt = new SignJWT({ business_id: BIZ, device_id: DEV, kind: 'device' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(DEV)
    .setAudience(audience)
    .setIssuedAt(now)
    .setExpirationTime(now + 365 * 86_400);
  if (audience === DEVICE_TOKEN_AUDIENCE) jwt.setIssuer(DEVICE_TOKEN_ISSUER);
  return jwt.sign(new TextEncoder().encode(key));
}

beforeEach(() => {
  vi.stubEnv('DEVICE_TOKEN_SECRET', CURRENT);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('device token verification, with no previous secret', () => {
  it('honours a token signed with the current secret, as before', async () => {
    assert.deepEqual(await verifyDeviceToken(await mintDeviceToken(BIZ, DEV)), CALLER);
  });

  it('refuses a token signed with any other secret', async () => {
    assert.equal(await verifyDeviceToken(await signedWith(UNKNOWN)), null);
    assert.equal(await verifyDeviceToken(await signedWith(PREVIOUS)), null);
  });

  it('an empty DEVICE_TOKEN_SECRET_PREVIOUS is no secret at all', async () => {
    vi.stubEnv('DEVICE_TOKEN_SECRET_PREVIOUS', '');
    assert.deepEqual(await verifyDeviceToken(await signedWith(CURRENT)), CALLER);
    // Not a second key, and not an error either: just absent.
    assert.equal(await verifyDeviceToken(await signedWith(UNKNOWN)), null);
  });

  it('refuses what is not a token, and a token of another kind', async () => {
    assert.equal(await verifyDeviceToken('not.a.jwt'), null);
    assert.equal(await verifyDeviceToken(await signedWith(CURRENT, 'someone-else')), null);
  });
});

describe('device token verification during a rotation', () => {
  beforeEach(() => {
    vi.stubEnv('DEVICE_TOKEN_SECRET_PREVIOUS', PREVIOUS);
  });

  it('a phone linked under the previous secret keeps working', async () => {
    assert.deepEqual(await verifyDeviceToken(await signedWith(PREVIOUS)), CALLER);
  });

  it('a pre-ADR-138 token under the previous secret keeps its legacy window too', async () => {
    const old = await signedWith(PREVIOUS, LEGACY_AUDIENCE, LEGACY_UNTIL - 86_400);
    assert.deepEqual(await verifyDeviceToken(old), CALLER);
  });

  it('the current secret still verifies, and an unknown one still does not', async () => {
    assert.deepEqual(await verifyDeviceToken(await signedWith(CURRENT)), CALLER);
    assert.equal(await verifyDeviceToken(await signedWith(UNKNOWN)), null);
  });

  it('minting always uses the current secret', async () => {
    const token = await mintDeviceToken(BIZ, DEV);
    vi.stubEnv('DEVICE_TOKEN_SECRET_PREVIOUS', '');
    assert.deepEqual(await verifyDeviceToken(token), CALLER, 'verifies with the current alone');
    vi.stubEnv('DEVICE_TOKEN_SECRET', PREVIOUS);
    assert.equal(await verifyDeviceToken(token), null, 'and not with the previous');
  });

  it('in production the previous secret answers to the same policy, by name', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('DEVICE_TOKEN_SECRET_PREVIOUS', 'conformance-only');
    await assert.rejects(
      verifyDeviceToken(await signedWith(CURRENT)),
      (e: unknown) =>
        e instanceof SecretPolicyError &&
        e.variable === 'DEVICE_TOKEN_SECRET_PREVIOUS' &&
        e.rule === 'PUBLISHED_VALUE',
    );
    vi.stubEnv('DEVICE_TOKEN_SECRET_PREVIOUS', PREVIOUS);
    assert.deepEqual(await verifyDeviceToken(await signedWith(PREVIOUS)), CALLER);
  });
});
