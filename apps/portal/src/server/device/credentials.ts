import 'server-only';

import * as ed from '@noble/ed25519';
import { canonicalize, DEVICE_TOKEN_TTL_SECONDS } from '@xangarro/contracts';
import { EntitlementSchema, type Entitlement } from '@xangarro/domain';
import { SignJWT } from 'jose';

/**
 * What a phone is handed when it joins a business: a device token and a signed
 * entitlement.
 *
 * Both are signed with keys that have **no default**. The contract's mock signs
 * entitlements with a keypair published in this repository
 * (`packages/contracts/src/mock/dev-keys.json`) — correct for a mock, and a
 * disaster if the portal could ever fall back to it: anyone could mint an
 * entitlement for any plan. So an unset key is an error, and local runs pass
 * the dev key explicitly.
 */

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`${name} is not set. Device credentials are signed with it.`);
  }
  return value;
}

/**
 * The device token (contract §2).
 *
 * `sub`/`role`/`aud` are the Supabase shape on purpose, as with the portal
 * session (ADR-061): a GoTrue-issued token would carry the same claims.
 * Revocation is server-side on the `devices` row, which is why the lifetime can
 * be a year — the token is not the thing that gets revoked.
 */
export async function mintDeviceToken(businessId: string, deviceId: string): Promise<string> {
  const secret = new TextEncoder().encode(required('DEVICE_TOKEN_SECRET'));
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ business_id: businessId, device_id: deviceId, kind: 'device' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(deviceId)
    .setAudience('authenticated')
    .setIssuedAt(now)
    .setExpirationTime(now + DEVICE_TOKEN_TTL_SECONDS)
    .sign(secret);
}

/**
 * Sign an entitlement: Ed25519 over `canonicalize(payload)` (contract §6).
 *
 * `canonicalize` is imported from the contract rather than reimplemented: the
 * signer and the verifier must hash byte-identical strings, and two
 * implementations of "sorted keys, no whitespace, bigint as decimal" are two
 * chances to disagree.
 */
export async function signEntitlement(payload: Entitlement) {
  const bytes = new TextEncoder().encode(canonicalize(payload));
  const signature = await ed.signAsync(
    bytes,
    ed.etc.hexToBytes(required('ENTITLEMENT_PRIVATE_KEY')),
  );
  return {
    payload: EntitlementSchema.parse(payload),
    signature: Buffer.from(signature).toString('base64'),
  };
}
