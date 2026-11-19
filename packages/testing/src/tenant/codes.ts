import { randomUUID } from 'node:crypto';

import { asTenant } from './connection.js';
import type { Tenant } from './mint.js';

/**
 * Activation codes for a tenant of its own (ADR-128): minted into the tenant's
 * `activation_codes` exactly as «Generar código» does, so a phone that redeems
 * one through the real `/activate` gets a token for that business and nothing
 * else.
 */

/**
 * A code of this run alone, in the contract's alphabet (no 0/O/1/I): the
 * device is named after it, so a spec can find its caja by name.
 */
export function codeOf(): string {
  const hex = randomUUID().replace(/-/g, '').toUpperCase();
  return `TP${hex.replace(/0/g, 'X').replace(/1/g, 'Y').slice(0, 6)}`;
}

/** Mints a live code for `t`, as the portal does, and returns it. */
export async function mintCodeFor(
  t: Pick<Tenant, 'biz' | 'email'>,
  expiresIn = '1 hour',
): Promise<string> {
  const code = codeOf();
  await asTenant(t.biz, async (sql) => {
    await sql`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES (${code}, ${t.email}, now() + ${expiresIn}::interval, ${t.biz}, now(), now())`;
  });
  return code;
}

/**
 * Frees the device slot `mintTenant` filled, so the plan's slots are the
 * phones' the caller activates. Call once, before the first activation.
 */
export async function freeSlots(t: Pick<Tenant, 'biz'>): Promise<void> {
  await asTenant(
    t.biz,
    (sql) => sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`,
  );
}
