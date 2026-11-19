import type { APIRequestContext } from '@playwright/test';
import { API_PATHS, deviceHeaders, encodeJson } from '@xangarro/contracts';
import { asTenant, BIZ, type Phone } from '@xangarro/testing/tenant';

/**
 * A phone, for the sync spec: activated through the real `/activate`, then
 * pushing and pulling over HTTP exactly as the app will.
 *
 * The connections, the seed's ids and the wire rows live in
 * `@xangarro/testing/tenant` since S-02 (ADR-153 §4) and are re-exported here,
 * so no spec's import changed. What stays is typed on Playwright's request
 * context: the HTTP calls.
 */
export {
  asOwner,
  asTenant,
  BIZ,
  client,
  CNF,
  CNF_PRODUCT,
  sale,
  TACO,
  ticket,
  type Phone,
} from '@xangarro/testing/tenant';

/** Frees Taquería's slots, then activates a phone with a code minted for it. */
export async function activatePhone(request: APIRequestContext, code: string): Promise<Phone> {
  await asTenant(BIZ, async (sql) => {
    // Re-mint by upsert: the app role cannot DELETE (data-pg 0036).
    await sql`
      INSERT INTO activation_codes (code, email, expires_at, business_id, created_at, updated_at)
      VALUES (${code}, 'pedro@taqueria.mx', now() + interval '1 hour', ${BIZ}, now(), now())
      ON CONFLICT (code) DO UPDATE SET email = EXCLUDED.email, expires_at = EXCLUDED.expires_at,
        business_id = EXCLUDED.business_id, redeemed_at = NULL, redeemed_by_device_id = NULL,
        updated_at = now()`;
  });
  return redeemCode(request, 'pedro@taqueria.mx', code);
}

/** The real `/activate` for a code already minted, as the phone sends it. */
export async function redeemCode(
  request: APIRequestContext,
  email: string,
  code: string,
): Promise<Phone> {
  const r = await request.post(API_PATHS.activate, {
    headers: deviceHeaders(),
    data: {
      email,
      code,
      device: { name: code, platform: 'android', appVersion: '0.1.0', osVersion: '15' },
    },
  });
  if (r.status() !== 200) throw new Error(`activate ${r.status()}: ${await r.text()}`);
  const body = await r.json();
  return {
    token: body.deviceToken,
    deviceId: body.deviceId,
    cursor: body.bootstrap.serverSeq,
    businessId: body.businessId,
  };
}

export const push = (request: APIRequestContext, phone: Phone, deltas: unknown[]) =>
  request.post(API_PATHS.syncPush, {
    headers: deviceHeaders(phone.token),
    data: encodeJson({ deltas }),
  });

export async function pull(request: APIRequestContext, phone: Phone, since: number) {
  const r = await request.get(`${API_PATHS.syncPull}?since=${since}`, {
    headers: deviceHeaders(phone.token),
  });
  if (r.status() !== 200) throw new Error(`pull ${r.status()}: ${await r.text()}`);
  return r.json();
}
