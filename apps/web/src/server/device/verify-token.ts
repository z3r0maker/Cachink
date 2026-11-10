import 'server-only';

import { jwtVerify } from 'jose';

import { deviceTokenVerificationKeys } from './credentials';
import {
  DEVICE_TOKEN_AUDIENCE,
  deviceClaimsOf,
  LEGACY_AUDIENCE,
  type DeviceClaims,
} from './token-shape';

/**
 * A device token's claims, or null when it is not one we honour (contract §2).
 *
 * Verified against the current `DEVICE_TOKEN_SECRET` and then, while a
 * rotation is under way, against `DEVICE_TOKEN_SECRET_PREVIOUS` (audit F-06):
 * the phones linked under the old secret keep working, and nothing is ever
 * minted with it again. The token carries no key id, so the ring is tried in
 * order; it is two keys at most.
 *
 * A signature proves which device and business. It does not prove the device
 * is still allowed — `authenticateDevice` reads the `devices` row for that.
 *
 * Throws only when a secret is unset or refused by the production policy:
 * that is the server's fault, not the caller's, and must not read as a 401.
 */
export async function verifyDeviceToken(token: string): Promise<DeviceClaims | null> {
  for (const key of deviceTokenVerificationKeys()) {
    const verified = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      audience: [DEVICE_TOKEN_AUDIENCE, LEGACY_AUDIENCE],
    }).catch(() => null);
    if (verified !== null) return deviceClaimsOf(verified.payload);
  }
  return null;
}
