/**
 * NotificationPreferences — per-device config for which Director alert
 * sources are active. Stored as JSON in AppConfig.
 *
 * Feature-flag awareness:
 *   - Feature OFF → related alerts are OFF and locked (cannot override).
 *   - Feature ON  → alerts default to ON but Director can override.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { z } from 'zod';
import { AlertSourceEnum, type AlertSource } from './director-alert.js';
import type { DirectorAlert } from './director-alert.js';
import type { FeatureFlagKey, FeatureFlags } from './feature-flags.js';

/** Record<AlertSource, boolean> — true = receive, false = suppress. */
export const NotificationPreferencesSchema = z.record(AlertSourceEnum, z.boolean());
export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

/**
 * Map each AlertSource to its parent FeatureFlagKey (null = always-on,
 * no feature-flag dependency).
 */
export const ALERT_SOURCE_FLAG_MAP: Readonly<Record<AlertSource, FeatureFlagKey | null>> = {
  'stock-bajo': 'stock',
  'caja-discrepancia': null,
  'caja-egreso-auto': null,
  'merma-threshold': 'merma',
  'auditoria-pendiente': 'auditoriaInventario',
  'auditoria-discrepancia': 'auditoriaInventario',
  'conversion-automatica': 'conversionMateriaPrima',
  'conversion-costo': 'conversionMateriaPrima',
  'credito-entrega': 'ventasCredito',
  'credito-vencido': 'ventasCredito',
  'usuario-cambio': null,
  'feature-flag-cambio': null,
  'gasto-recurrente-pendiente': null,
} as const;

/** All 13 alert sources in display order. */
export const ALL_ALERT_SOURCES = Object.keys(ALERT_SOURCE_FLAG_MAP) as AlertSource[];

/**
 * Derive default notification preferences from the current feature flags.
 * Always-on sources default to true; feature-gated sources mirror their flag.
 */
export function deriveDefaultPrefs(flags: FeatureFlags): NotificationPreferences {
  const prefs: Record<string, boolean> = {};
  for (const [source, flagKey] of Object.entries(ALERT_SOURCE_FLAG_MAP)) {
    prefs[source] = flagKey === null ? true : flags[flagKey] ?? false;
  }
  return prefs as NotificationPreferences;
}

/**
 * Resolve effective preferences: stored Director overrides merged with
 * feature-flag locks. When a feature is OFF, its alerts are forced OFF
 * regardless of the stored preference.
 */
export function resolveEffectivePrefs(
  stored: NotificationPreferences,
  flags: FeatureFlags,
): NotificationPreferences {
  const effective = { ...stored };
  for (const [source, flagKey] of Object.entries(ALERT_SOURCE_FLAG_MAP)) {
    if (flagKey !== null && !flags[flagKey]) {
      (effective as Record<string, boolean>)[source] = false;
    }
  }
  return effective;
}

/**
 * Check whether a given alert source is locked (cannot be toggled)
 * because its parent feature flag is OFF.
 */
export function isSourceLocked(source: AlertSource, flags: FeatureFlags): boolean {
  const flagKey = ALERT_SOURCE_FLAG_MAP[source];
  return flagKey !== null && !flags[flagKey];
}

/**
 * Filter alerts by active feature flags. Alerts whose source maps to a
 * disabled flag are excluded. Sources with no flag mapping (null in
 * ALERT_SOURCE_FLAG_MAP) always pass — they belong to always-on features.
 */
export function filterAlertsByFlags(
  alerts: readonly DirectorAlert[],
  flags: FeatureFlags,
): DirectorAlert[] {
  return alerts.filter((alert) => {
    const flagKey = ALERT_SOURCE_FLAG_MAP[alert.source];
    // null = always-on source, no flag dependency
    if (flagKey === null || flagKey === undefined) return true;
    return flags[flagKey];
  });
}
