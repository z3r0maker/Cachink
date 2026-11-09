import assert from 'node:assert/strict';
import { beforeAll, describe, it } from 'vitest';
import { decodeJwt, jwtVerify, SignJWT } from 'jose';
import { DeviceTokenClaimsSchema } from '@xangarro/contracts';

import { deviceTokenSecret, mintDeviceToken } from '../src/server/device/credentials';
import {
  DEVICE_TOKEN_AUDIENCE,
  DEVICE_TOKEN_ISSUER,
  deviceClaimsOf,
  LEGACY_AUDIENCE,
  LEGACY_UNTIL,
} from '../src/server/device/token-shape';

/**
 * The device token's shape (audit SEC-DATA-01, ADR-138): Xangarro's own issuer
 * and audience, never Supabase's; the old shape only for phones linked before
 * the change.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const DEV = '01HZ8XQN9GZJXV8AKQ5X0CDEV1';

beforeAll(() => {
  process.env.DEVICE_TOKEN_SECRET = 'ci-only-not-a-real-secret-device-token';
});

async function legacy(iat: number, extra: Record<string, unknown> = {}) {
  const t = await new SignJWT({ business_id: BIZ, device_id: DEV, kind: 'device', ...extra })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(DEV)
    .setAudience(LEGACY_AUDIENCE)
    .setIssuedAt(iat)
    .setExpirationTime(iat + 365 * 86_400)
    .sign(deviceTokenSecret());
  return decodeJwt(t);
}

describe('device tokens (ADR-138)', () => {
  it('a new token names Xangarro as issuer and its own audience, and fits the contract', async () => {
    const token = await mintDeviceToken(BIZ, DEV);
    const { payload } = await jwtVerify(token, deviceTokenSecret(), {
      issuer: DEVICE_TOKEN_ISSUER,
      audience: DEVICE_TOKEN_AUDIENCE,
    });
    assert.notEqual(payload.aud, 'authenticated');
    assert.ok(DeviceTokenClaimsSchema.safeParse(payload).success);
    assert.deepEqual(deviceClaimsOf(payload), { businessId: BIZ, deviceId: DEV });
  });

  it('a phone linked before the change keeps working until its token expires', async () => {
    assert.deepEqual(deviceClaimsOf(await legacy(LEGACY_UNTIL - 86_400)), {
      businessId: BIZ,
      deviceId: DEV,
    });
  });

  it('the old shape issued after the change is refused: nothing mints it any more', async () => {
    assert.equal(deviceClaimsOf(await legacy(LEGACY_UNTIL + 1)), null);
  });

  it('a mix of the two shapes is refused', async () => {
    assert.equal(
      deviceClaimsOf(await legacy(LEGACY_UNTIL - 1, { iss: DEVICE_TOKEN_ISSUER })),
      null,
    );
    assert.equal(
      deviceClaimsOf({
        kind: 'device',
        business_id: BIZ,
        device_id: DEV,
        sub: DEV,
        aud: DEVICE_TOKEN_AUDIENCE,
      }),
      null,
      'the new audience without the issuer',
    );
  });

  it('a token for another device, or not a device token, is refused', () => {
    const base = {
      business_id: BIZ,
      device_id: DEV,
      sub: DEV,
      aud: DEVICE_TOKEN_AUDIENCE,
      iss: DEVICE_TOKEN_ISSUER,
    };
    assert.equal(deviceClaimsOf({ ...base, kind: 'device', sub: 'otro' }), null);
    assert.equal(deviceClaimsOf({ ...base, kind: 'session' }), null);
    assert.equal(deviceClaimsOf({ ...base, kind: 'device', business_id: 7 }), null);
  });
});
