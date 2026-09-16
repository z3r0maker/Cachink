/**
 * AppConfig types — the cross-session state the shell needs to boot: which
 * mode, which business, who is signed in. There is one role on the device
 * (ADR-053); who is signed in is `userId`.
 *
 * `mode` is vestigial after activation (always `'local'`, syncing to the
 * cloud); retired values are normalised by {@link parseMode}.
 */

import { SYNC_CONFIG_KEYS } from '@xangarro/sync';
import type { BusinessId, DeviceId, UserId } from '@xangarro/domain';

/** Storage mode. LAN modes were retired in A-18 (ADR-053 §6). */
export type AppMode = 'local' | 'cloud';

/** AppConfig-repository keys used by the provider. */
export const APP_CONFIG_KEYS = {
  deviceId: 'deviceId',
  mode: 'mode',
  currentBusinessId: 'currentBusinessId',
  notificationsEnabled: 'notificationsEnabled',
  crashReportingEnabled: 'crashReportingEnabled',
  tipoNegocio: 'tipoNegocio',
  categoriaVentaPredeterminada: 'categoriaVentaPredeterminada',
  atributosProducto: 'atributosProducto',
  isrDefaults: 'isrDefaults',
  autoLockTimeout: 'autoLockTimeout',
  discoveryShown: 'discoveryShown',
  cachinkSoundEnabled: 'cachinkSoundEnabled',
  healthThresholds: 'healthThresholds',
  notificationPrefs: 'notificationPrefs',
  /** JSON `{ deviceId, businessId, activatedAt }` once the device is activated (A-04). */
  activation: 'activation',
  /** JSON `{ failures, lockedUntil }` — wrong-PIN cooldown survives restarts (A-05). */
  pinLockout: 'pinLockout',
  /** Cloud-sync keys (entitlement, server time, cursors) are owned by @xangarro/sync. */
  ...SYNC_CONFIG_KEYS,
} as const;

/** Shape of the Zustand store populated on launch. */
export interface AppConfigState {
  readonly deviceId: DeviceId | null;
  readonly mode: AppMode | null;
  readonly currentBusinessId: BusinessId | null;
  readonly hydrated: boolean;
  readonly notificationsEnabled: boolean;
  readonly crashReportingEnabled: boolean | null;
  /** Currently authenticated user (null = not logged in). */
  readonly userId: UserId | null;
  /** Whether the feature-discovery screen was shown after first setup. */
  readonly discoveryShown: boolean;
  /** Whether the "¡CACHINK!" sound plays on each sale. Defaults to true. */
  readonly cachinkSoundEnabled: boolean;
}

/** Allowed mode values. */
export const APP_MODES: readonly AppMode[] = ['local', 'cloud'];

/** Values older installs may hold; all of them boot as `'local'`. */
const RETIRED_MODES: readonly string[] = [
  'local-standalone',
  'tablet-only',
  'lan',
  'lan-server',
  'lan-client',
];

/** Narrow a stored string to an {@link AppMode}; unknown → `null`. */
export function parseMode(raw: string | null): AppMode | null {
  if (raw === null) return null;
  if (RETIRED_MODES.includes(raw)) return 'local';
  return (APP_MODES as readonly string[]).includes(raw) ? (raw as AppMode) : null;
}
