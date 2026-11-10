import type { APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';

import { asTenant, redeemCode, type Phone } from './sync-phone';
import type { Tenant } from './tenant';

/**
 * A phone on a tenant of its own (ADR-128), for the sync specs that write: the
 * code is minted into the tenant's `activation_codes` exactly as «Generar
 * código» does, and redeemed through the real `/activate`, so the phone gets a
 * token for that business and nothing else. `sync-phone.ts`'s `ticket`, `sale`
 * and `client` take the phone and write rows for its business.
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
export async function mintCodeFor(t: Tenant, expiresIn = '1 hour'): Promise<string> {
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
 * phones' this spec activates. Call once, before the first `activateOn`.
 */
export async function freeSlots(t: Tenant): Promise<void> {
  await asTenant(
    t.biz,
    (sql) => sql`UPDATE devices SET revoked_at = now() WHERE revoked_at IS NULL`,
  );
}

/** A phone joined to `t` through the real `/activate`. */
export async function activateOn(request: APIRequestContext, t: Tenant): Promise<Phone> {
  return redeemCode(request, t.email, await mintCodeFor(t));
}
