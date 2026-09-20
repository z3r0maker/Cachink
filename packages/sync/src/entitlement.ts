/**
 * Entitlement on the device (A-10, ADR-053 §5, Q9/Q14).
 *
 * `verifyEntitlement` checks the Ed25519 signature over `canonicalize(payload)`
 * with synchronous SHA-512 from `@noble/hashes` (Hermes has no WebCrypto).
 * `resolveEntitlement` turns what sync stored into the plan the app enforces:
 * anything unverifiable or lapsed falls back to Freelancer limits — never a
 * crash, never a lock. Time is anchored: `max(device clock, last server time)`
 * so setting the phone's date back cannot revive an expired plan.
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { SignedEntitlementSchema, canonicalize } from '@xangarro/contracts';
import {
  FALLBACK_PLAN,
  PLAN_LIMITS,
  entitlementState,
  type Entitlement,
  type EntitlementState,
  type PlanId,
} from '@xangarro/domain';

ed.hashes.sha512 = sha512;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** Minimal base64 decoder — no `atob`/`Buffer` dependency across runtimes. */
export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/=+$/, '');
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    const idx = B64.indexOf(ch);
    if (idx < 0) throw new Error('invalid base64');
    value = (value << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

/** The verified payload, or `null` when the envelope is malformed or the signature fails. */
export function verifyEntitlement(raw: unknown, publicKeyHex: string): Entitlement | null {
  const parsed = SignedEntitlementSchema.safeParse(raw);
  if (!parsed.success) return null;
  try {
    const message = new TextEncoder().encode(canonicalize(parsed.data.payload));
    const signature = base64ToBytes(parsed.data.signature);
    const ok = ed.verify(signature, message, ed.etc.hexToBytes(publicKeyHex));
    return ok ? parsed.data.payload : null;
  } catch {
    return null;
  }
}

export interface ResolvedEntitlement {
  /** The plan whose limits apply right now. */
  readonly plan: PlanId;
  readonly recordsPerMonth: number | null;
  readonly state: EntitlementState;
  /** False when nothing verifiable is stored (never synced, bad signature). */
  readonly verified: boolean;
  /** Plan the server granted, even if it currently falls back (for the "Plan Freelancer" banner). */
  readonly grantedPlan: PlanId | null;
  /** End of the payment grace window, for the "tienes hasta" banner. */
  readonly graceUntil: string | null;
  /** `max(device clock, last server time)`. */
  readonly nowAnchored: string;
}

export interface ResolveEntitlementInput {
  readonly storedJson: string | null;
  readonly lastServerTime: string | null;
  readonly lastPullAt: string | null;
  readonly deviceNow: Date;
  readonly publicKeyHex: string;
}

export function anchoredNow(deviceNow: Date, lastServerTime: string | null): Date {
  const server = lastServerTime ? Date.parse(lastServerTime) : Number.NaN;
  return Number.isFinite(server) && server > deviceNow.getTime() ? new Date(server) : deviceNow;
}

function parseJson(json: string | null): unknown {
  try {
    return json ? (JSON.parse(json) as unknown) : null;
  } catch {
    return null;
  }
}

export function resolveEntitlement(input: ResolveEntitlementInput): ResolvedEntitlement {
  const nowAnchored = anchoredNow(input.deviceNow, input.lastServerTime).toISOString();
  const payload = verifyEntitlement(parseJson(input.storedJson), input.publicKeyHex);
  if (!payload) {
    const limits = PLAN_LIMITS[FALLBACK_PLAN];
    return {
      plan: FALLBACK_PLAN,
      recordsPerMonth: limits.recordsPerMonth,
      state: 'lapsed',
      verified: false,
      grantedPlan: null,
      graceUntil: null,
      nowAnchored,
    };
  }
  const state = entitlementState(payload, { nowAnchored, lastPullAt: input.lastPullAt });
  const lapsed = state === 'lapsed';
  return {
    plan: lapsed ? FALLBACK_PLAN : payload.plan,
    recordsPerMonth: lapsed
      ? PLAN_LIMITS[FALLBACK_PLAN].recordsPerMonth
      : payload.limits.recordsPerMonth,
    state,
    verified: true,
    grantedPlan: payload.plan,
    graceUntil: payload.graceUntil,
    nowAnchored,
  };
}
