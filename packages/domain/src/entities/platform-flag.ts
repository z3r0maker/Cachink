/**
 * Platform flags (N-09) — the **platform** level of the three-level flags
 * (platform × plan × tenant, ADR-053 / docs/plan Q10), made editable by staff
 * in the admin console instead of living only in code. A **portal-only**
 * entity under ADR-060: Postgres only, never synced. Devices still learn the
 * outcome solely through the signed entitlement.
 *
 * Two kinds of key share one table:
 *
 * - every `FeatureFlagKey` — whether a built feature is released at all;
 * - three **kill switches** for surfaces that must be stoppable in
 *   production without a deploy: the Asesor's model calls (this replaces
 *   ADR-059's environment gate), sharing comprobantes, and integrated card
 *   collection once it exists.
 *
 * A key with no row keeps its code default (`PLATFORM_FLAG_DEFAULTS`), so an
 * empty table behaves exactly like the `PLATFORM_AVAILABLE` constant did.
 */

import { z } from 'zod';

import type { BusinessId, Ulid } from '../ids/index.js';
import { FEATURE_FLAG_KEYS, PLATFORM_AVAILABLE } from './feature-flags.js';
import type { StaffMemberId } from './staff.js';
import { ulidField } from './_ulid-field.js';

export const KILL_SWITCH_KEYS = ['asesorLlm', 'comprobanteShare', 'cobrosIntegrados'] as const;
export type KillSwitchKey = (typeof KILL_SWITCH_KEYS)[number];

export const PLATFORM_FLAG_KEYS = [...FEATURE_FLAG_KEYS, ...KILL_SWITCH_KEYS] as const;
export type PlatformFlagKey = (typeof PLATFORM_FLAG_KEYS)[number];

/** `off` = dark for everyone; `on` = released; `allowlist` = only the listed businesses. */
export const PLATFORM_FLAG_MODES = ['off', 'on', 'allowlist'] as const;
export type PlatformFlagMode = (typeof PLATFORM_FLAG_MODES)[number];

/** Upper bound on a beta list — past this it is a launch, not a beta. */
export const MAX_ALLOWLIST = 500;

export type PlatformFlagDefaults = Readonly<Record<PlatformFlagKey, boolean>>;

/**
 * What a key is when nobody has set it. Feature keys follow the code
 * constant; the Asesor's model call starts dark, as ADR-059 ships it
 * («Próximamente»); comprobantes already ship; card collection is not built.
 */
export const PLATFORM_FLAG_DEFAULTS: PlatformFlagDefaults = {
  ...PLATFORM_AVAILABLE,
  asesorLlm: false,
  comprobanteShare: true,
  cobrosIntegrados: false,
} as const;

export const PlatformFlagSchema = z
  .object({
    key: z.enum(PLATFORM_FLAG_KEYS),
    mode: z.enum(PLATFORM_FLAG_MODES),
    allowlistBusinessIds: z.array(ulidField<BusinessId>()).max(MAX_ALLOWLIST),
    reason: z.string().trim().min(3).max(500),
    updatedBy: ulidField<StaffMemberId>(),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .refine((f) => (f.mode === 'allowlist') === f.allowlistBusinessIds.length > 0, {
    path: ['allowlistBusinessIds'],
    message: 'La lista beta solo aplica, y es obligatoria, en modo «lista».',
  });
export type PlatformFlag = z.infer<typeof PlatformFlagSchema>;

/**
 * The part of a flag the availability rule reads. `PlatformFlag` satisfies
 * it; so does the portal's narrow view, which carries no reason or author
 * and filters the allowlist down to the caller's own business.
 */
export type PlatformFlagRule = Pick<
  PlatformFlag,
  'key' | 'mode' | 'allowlistBusinessIds' | 'updatedAt'
>;

/** One change to a key; the current state is the latest event per key. */
export type PlatformFlagEventId = Ulid & { readonly __entity: 'PlatformFlagEvent' };

export class UnknownPlatformFlagError extends Error {
  readonly code = 'UNKNOWN_PLATFORM_FLAG' as const;
  constructor(readonly key: string) {
    super(`Clave de plataforma desconocida: ${key}`);
    this.name = 'UnknownPlatformFlagError';
  }
}

function knownKey(key: string): PlatformFlagKey {
  if (!(PLATFORM_FLAG_KEYS as readonly string[]).includes(key)) {
    throw new UnknownPlatformFlagError(key);
  }
  return key as PlatformFlagKey;
}

function decide(
  flag: PlatformFlagRule | undefined,
  businessId: string,
  fallback: boolean,
): boolean {
  if (flag === undefined) return fallback;
  if (flag.mode === 'allowlist')
    return flag.allowlistBusinessIds.includes(businessId as BusinessId);
  return flag.mode === 'on';
}

/** The latest row per key, in case a caller hands in more than one. */
function latestByKey(flags: readonly PlatformFlagRule[]): Map<PlatformFlagKey, PlatformFlagRule> {
  const byKey = new Map<PlatformFlagKey, PlatformFlagRule>();
  for (const f of flags) {
    const seen = byKey.get(f.key);
    if (seen === undefined || Date.parse(f.updatedAt) > Date.parse(seen.updatedAt)) {
      byKey.set(f.key, f);
    }
  }
  return byKey;
}

/**
 * Is `key` released to `businessId`? A row decides; no row means the default.
 * An unknown key throws rather than answering false — a typo must not
 * quietly switch a feature off.
 */
export function isPlatformAvailable(
  key: string,
  businessId: string,
  flags: readonly PlatformFlagRule[],
  defaults: PlatformFlagDefaults,
): boolean {
  const k = knownKey(key);
  return decide(latestByKey(flags).get(k), businessId, defaults[k]);
}

/** Every key for one business — what an entitlement computation reads once. */
export function resolvePlatformFlags(
  businessId: string,
  flags: readonly PlatformFlagRule[],
  defaults: PlatformFlagDefaults,
): Record<PlatformFlagKey, boolean> {
  const byKey = latestByKey(flags);
  const out = {} as Record<PlatformFlagKey, boolean>;
  for (const k of PLATFORM_FLAG_KEYS) out[k] = decide(byKey.get(k), businessId, defaults[k]);
  return out;
}
