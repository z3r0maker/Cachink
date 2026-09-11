/**
 * Signed entitlement envelope (docs/plan/02-contracts.md §6, §7).
 * The payload is the domain `Entitlement`; the signature is Ed25519 over
 * `canonicalize(payload)`. No crypto here — see `tests/` for the vector.
 */

import { z } from 'zod';
import { EntitlementSchema } from '@xangarro/domain';

export const SignedEntitlementSchema = z.object({
  payload: EntitlementSchema,
  /** base64 Ed25519 signature over canonicalize(payload). */
  signature: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/),
});
export type SignedEntitlement = z.infer<typeof SignedEntitlementSchema>;

/** `GET /entitlement` response (§7). */
export const EntitlementResponseSchema = z.object({ entitlement: SignedEntitlementSchema });
export type EntitlementResponse = z.infer<typeof EntitlementResponseSchema>;

/**
 * Deterministic JSON: keys sorted at every depth, no whitespace, bigint as
 * decimal string, `undefined` members dropped. Both signer and verifier
 * MUST hash exactly this string.
 */
export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'bigint' ? JSON.stringify(value.toString()) : JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`);
  return `{${entries.join(',')}}`;
}
