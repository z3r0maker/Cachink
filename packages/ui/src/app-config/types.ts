/**
 * AppConfig types — the three pieces of cross-session state the shell
 * needs to boot: which deployment mode, which business, who's using the
 * tablet right now.
 *
 * Role is a session attribute (not persisted) — CLAUDE.md §1 two-role
 * model: `operativo` (read/write) vs `director` (read-only on
 * transactional modules + full access to financial views).
 *
 * Mode is persisted so the wizard runs only once. `null` means the
 * wizard has not completed; every boot after that skips it.
 */

import type { BusinessId, DeviceId } from '@cachink/domain';

/** Deployment mode selected in the first-run wizard (CLAUDE.md §7.4). */
export type AppMode = 'local-standalone' | 'tablet-only' | 'lan' | 'cloud';

/** User role for the current session (CLAUDE.md §1). */
export type Role = 'operativo' | 'director';

/** AppConfig-repository keys used by the provider. */
export const APP_CONFIG_KEYS = {
  deviceId: 'deviceId',
  mode: 'mode',
  currentBusinessId: 'currentBusinessId',
} as const;

/** Shape of the Zustand store populated on launch. */
export interface AppConfigState {
  readonly deviceId: DeviceId | null;
  readonly mode: AppMode | null;
  readonly currentBusinessId: BusinessId | null;
  readonly role: Role | null;
  readonly hydrated: boolean;
}

/** Allowed mode values — keep in sync with CLAUDE.md §7.1. */
export const APP_MODES: readonly AppMode[] = ['local-standalone', 'tablet-only', 'lan', 'cloud'];

/** Narrow a raw string to a valid {@link AppMode} or return null. */
export function parseMode(raw: string | null): AppMode | null {
  if (raw === null) return null;
  return (APP_MODES as readonly string[]).includes(raw) ? (raw as AppMode) : null;
}
