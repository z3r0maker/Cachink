import 'server-only';

import * as ed from '@noble/ed25519';
import { canonicalize, DEVICE_TOKEN_TTL_SECONDS } from '@xangarro/contracts';
import { EntitlementSchema, type Entitlement } from '@xangarro/domain';
import { SignJWT } from 'jose';

import { assertSecretPolicy, type SecretName } from './secret-policy';
import { DEVICE_TOKEN_AUDIENCE, DEVICE_TOKEN_ISSUER } from './token-shape';

/**
 * What a phone is handed when it joins a business: a device token and a signed
 * entitlement.
 *
 * Both are signed with keys that have **no default**. The contract's mock signs
 * entitlements with a keypair published in this repository
 * (`packages/contracts/src/mock/dev-keys.json`) — correct for a mock, and a
 * disaster if the portal could ever fall back to it: anyone could mint an
 * entitlement for any plan. So an unset key is an error, and local runs pass
 * the dev key explicitly. In production a key must also pass
 * `secret-policy.ts` (audit F-06): long enough, and never a published value.
 */

function required(name: SecretName): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`${name} is not set. Device credentials are signed with it.`);
  }
  assertSecretPolicy(name, value);
  return value;
}

/** Both signing keys are set — checked before activation spends a code on a phone. */
export function assertCredentialsConfigured(): void {
  required('DEVICE_TOKEN_SECRET');
  required('ENTITLEMENT_PRIVATE_KEY');
}

/** The HS256 key device tokens are signed with — always the current secret. */
export function deviceTokenSecret(): Uint8Array {
  return new TextEncoder().encode(required('DEVICE_TOKEN_SECRET'));
}

/**
 * The keys a device token may verify against: the current secret, then
 * `DEVICE_TOKEN_SECRET_PREVIOUS` while a rotation is under way (audit F-06).
 *
 * To rotate: move the current value to `DEVICE_TOKEN_SECRET_PREVIOUS`, set a
 * new `DEVICE_TOKEN_SECRET`, deploy. Phones linked under the old secret keep
 * working; every new token is signed with the new one. Tokens live a year, so
 * the previous secret is removed a year after the rotation — or sooner to cut
 * off the old tokens, whose phones then link again. The previous secret
 * answers to the same production policy as the current one.
 */
export function deviceTokenVerificationKeys(): Uint8Array[] {
  const keys = [deviceTokenSecret()];
  const previous = process.env.DEVICE_TOKEN_SECRET_PREVIOUS;
  if (previous !== undefined && previous !== '') {
    assertSecretPolicy('DEVICE_TOKEN_SECRET_PREVIOUS', previous);
    keys.push(new TextEncoder().encode(previous));
  }
  return keys;
}

/**
 * The device token (contract §2).
 *
 * It names Xangarro as issuer and its own audience (`token-shape.ts`,
 * ADR-138), never Supabase's shape: a token one shared secret away from being
 * a Supabase REST credential was audit SEC-DATA-01.
 * Revocation is server-side on the `devices` row, which is why the lifetime can
 * be a year — the token is not the thing that gets revoked.
 */
export async function mintDeviceToken(businessId: string, deviceId: string): Promise<string> {
  const secret = deviceTokenSecret();
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ business_id: businessId, device_id: deviceId, kind: 'device' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(deviceId)
    .setIssuer(DEVICE_TOKEN_ISSUER)
    .setAudience(DEVICE_TOKEN_AUDIENCE)
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
