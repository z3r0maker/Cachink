/**
 * Feature flags — business-level configuration stored as JSON.
 *
 * Each flag represents a system capability that can be toggled ON/OFF.
 * Some flags have dependency relationships (e.g., conversionMateriaPrima
 * requires stock to be ON). Disabling a parent flag cascades to all
 * transitive dependents.
 *
 * Phase 3 of the Feature Flags plan.
 */

export const FEATURE_FLAG_KEYS = [
  'stock',
  'barcode',
  'conversionMateriaPrima',
  'conversionAutomatica',
  'auditoriaInventario',
  'merma',
  'ventasCredito',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
export type FeatureFlags = Record<FeatureFlagKey, boolean>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  stock: true,
  barcode: true,
  conversionMateriaPrima: false,
  conversionAutomatica: false,
  auditoriaInventario: false,
  merma: false,
  ventasCredito: false,
} as const;

/**
 * Platform availability — the first of the three flag levels
 * (platform × plan × tenant, docs/plan Q10). A key that is `false` here is
 * dark for every business regardless of plan or toggle: the feature may be
 * built but is not released. Flip a key to `true` to release it; Directors
 * then opt in per business from the portal. Replaces the MVP clamp.
 */
export const PLATFORM_AVAILABLE: FeatureFlags = {
  stock: true,
  barcode: true,
  conversionMateriaPrima: false,
  conversionAutomatica: false,
  auditoriaInventario: false,
  merma: false,
  ventasCredito: false,
} as const;

/** Parent flag that must be ON for the child to be enabled. */
export const FEATURE_FLAG_DEPENDENCIES: Partial<Record<FeatureFlagKey, FeatureFlagKey>> = {
  conversionMateriaPrima: 'stock',
  conversionAutomatica: 'conversionMateriaPrima',
  auditoriaInventario: 'stock',
  merma: 'stock',
} as const;

/**
 * When disabling a flag, cascade-disable all transitive dependents.
 *
 * Two passes handle chains like:
 * stock → conversionMateriaPrima → conversionAutomatica
 */
export function resolveDisableCascade(
  flags: FeatureFlags,
  disabledKey: FeatureFlagKey,
): FeatureFlags {
  const result = { ...flags, [disabledKey]: false };
  const deps = Object.entries(FEATURE_FLAG_DEPENDENCIES) as [FeatureFlagKey, FeatureFlagKey][];
  // Pass 1: disable direct children
  for (const [child, parent] of deps) {
    if (!result[parent]) {
      result[child] = false;
    }
  }
  // Pass 2: handle transitive deps
  for (const [child, parent] of deps) {
    if (!result[parent]) {
      result[child] = false;
    }
  }
  return result;
}

/** Check if enabling a flag is allowed (parent must be ON). */
export function canEnableFlag(flags: FeatureFlags, key: FeatureFlagKey): boolean {
  const parent = FEATURE_FLAG_DEPENDENCIES[key];
  return parent === undefined || flags[parent];
}

/** Parse the **tenant** layer from the stored JSON, falling back to defaults.
 *  No clamping happens here any more — availability and plan are applied by
 *  `resolveEffectiveFlags` (effective-flags.ts). */
export function parseFeatureFlags(raw: string): FeatureFlags {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result = { ...DEFAULT_FEATURE_FLAGS };
    for (const key of FEATURE_FLAG_KEYS) {
      if (typeof parsed[key] === 'boolean') {
        result[key] = parsed[key];
      }
    }
    return result;
  } catch {
    return { ...DEFAULT_FEATURE_FLAGS };
  }
}
