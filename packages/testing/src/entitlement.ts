/**
 * Signed test entitlements (A-10/A-14). Signs with the contracts mock's dev
 * key, which is also the UI's default public key, so a seeded app_config
 * resolves to a real, verified plan in component and hook tests.
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { canonicalize } from '@xangarro/contracts';
import type { AppConfigRepository } from '@xangarro/data';
import { PLAN_LIMITS, type Entitlement, type PlanId } from '@xangarro/domain';

ed.hashes.sha512 = sha512;

/** DEV ONLY — `packages/contracts/src/mock/dev-keys.json`. */
const DEV_PRIVATE_HEX = '9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60';
const DAY_MS = 86_400_000;
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Standard padded base64 without relying on Node's `Buffer` typings. */
function toBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = ((bytes[i] ?? 0) << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    out += B64[(n >> 18) & 63]! + B64[(n >> 12) & 63]!;
    out += i + 1 < bytes.length ? B64[(n >> 6) & 63]! : '=';
    out += i + 2 < bytes.length ? B64[n & 63]! : '=';
  }
  return out;
}

export function signedTestEntitlement(
  plan: PlanId = 'mipyme_pro',
  now: Date = new Date(),
): { payload: Entitlement; signature: string } {
  const limits = PLAN_LIMITS[plan];
  const payload: Entitlement = {
    businessId: 'TEST',
    plan,
    limits: {
      operators: limits.operators,
      devices: limits.devices,
      recordsPerMonth: limits.recordsPerMonth,
    },
    features: [...limits.features],
    validUntil: new Date(now.getTime() + 30 * DAY_MS).toISOString(),
    graceUntil: new Date(now.getTime() + 37 * DAY_MS).toISOString(),
    issuedAt: now.toISOString(),
    serverTime: now.toISOString(),
    version: 1,
  };
  const message = new TextEncoder().encode(canonicalize(payload));
  const sig = ed.sign(message, ed.etc.hexToBytes(DEV_PRIVATE_HEX));
  return { payload, signature: toBase64(sig) };
}

/** Store a verified entitlement plus fresh sync clocks, as a successful pull would. */
export async function seedTestEntitlement(
  appConfig: AppConfigRepository,
  plan: PlanId = 'mipyme_pro',
  now: Date = new Date(),
): Promise<void> {
  await appConfig.set('entitlement', JSON.stringify(signedTestEntitlement(plan, now)));
  await appConfig.set('lastServerTime', now.toISOString());
  await appConfig.set('lastPullAt', now.toISOString());
}
