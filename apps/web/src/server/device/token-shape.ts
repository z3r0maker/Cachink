/**
 * The device token's shape (contract §2; audit SEC-DATA-01, ADR-138).
 *
 * Until ADR-138 a device token carried Supabase's shape (`aud: 'authenticated'`,
 * no issuer), so it was one shared secret away from being a credential for
 * Supabase's REST API. A new token names Xangarro as its issuer and its own
 * audience, which neither PostgREST nor GoTrue accepts.
 *
 * Tokens are minted once, at activation, and live a year, so phones linked
 * before the change still hold the old shape. Those are accepted only when
 * issued before `LEGACY_UNTIL`: nothing mints that shape any more, and the
 * last one expires a year after it. Then `LEGACY_AUDIENCE` goes.
 */

import { DEVICE_TOKEN_AUDIENCE, DEVICE_TOKEN_ISSUER } from '@xangarro/contracts';

export { DEVICE_TOKEN_AUDIENCE, DEVICE_TOKEN_ISSUER };

/** The pre-ADR-138 audience; accepted only on tokens issued before `LEGACY_UNTIL`. */
export const LEGACY_AUDIENCE = 'authenticated' as const;

/** Seconds since the epoch: 2026-11-16T00:00:00Z, after this change ships. */
export const LEGACY_UNTIL = 1_794_787_200;

export interface DeviceClaims {
  readonly businessId: string;
  readonly deviceId: string;
}

/** What a verified token's payload must say; `null` when it is not a device token we honour. */
export function deviceClaimsOf(payload: Readonly<Record<string, unknown>>): DeviceClaims | null {
  const { business_id: businessId, device_id: deviceId, kind, sub, aud, iss, iat } = payload;
  if (kind !== 'device' || typeof businessId !== 'string' || typeof deviceId !== 'string') {
    return null;
  }
  if (sub !== deviceId) return null;
  const nuevo = aud === DEVICE_TOKEN_AUDIENCE && iss === DEVICE_TOKEN_ISSUER;
  const legado =
    aud === LEGACY_AUDIENCE && iss === undefined && typeof iat === 'number' && iat < LEGACY_UNTIL;
  return nuevo || legado ? { businessId, deviceId } : null;
}
