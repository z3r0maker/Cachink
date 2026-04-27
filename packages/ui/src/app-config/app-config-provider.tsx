/**
 * AppConfigProvider — hydrates the Zustand store from the
 * {@link AppConfigRepository} on mount. Pre-ADR-039 legacy mode values
 * (`'local-standalone'`, `'tablet-only'`, `'lan'`) are migrated
 * in-place; the `'lan'` sentinel resolves via the optional
 * `resolveLegacyLan` callback that reads
 * `__cachink_sync_state.lanRole`. When the callback is omitted the
 * fallback is `'lan-client'` (safer than `'lan-server'`).
 *
 * Returns `null` while hydrating so the splash stays visible; children
 * mount once `hydrated === true`.
 */

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { newEntityId, type BusinessId, type DeviceId } from '@cachink/domain';
import type { AppConfigRepository } from '@cachink/data';
import { useAppConfigStore } from './use-app-config';
import { APP_CONFIG_KEYS, parseMode, type AppMode } from './types';

export interface AppConfigProviderProps {
  readonly children: ReactNode;
  /**
   * AppConfig repository injected by the composition root. Must always be
   * the same instance across renders — re-creating it would loop the
   * hydration effect.
   */
  readonly appConfig: AppConfigRepository;
  /**
   * Test-only: deterministic deviceId to use when generating a fresh one.
   * Left undefined in production (ulid() is called).
   */
  readonly generateDeviceId?: () => DeviceId;
  /**
   * If true, skip the async hydration effect entirely. Used by tests that
   * seed the store directly.
   */
  readonly skipHydration?: boolean;
  /**
   * Resolver for the pre-ADR-039 `'lan'` mode value. Reads
   * `__cachink_sync_state.lanRole` and returns `'lan-server'` when role
   * was `'host'`, otherwise `'lan-client'`. Provided by the
   * `DrizzleAppConfigBridge` (which has the SQLite handle); omit in
   * tests that don't exercise the legacy-lan migration.
   */
  readonly resolveLegacyLan?: () => Promise<'lan-server' | 'lan-client'>;
}

interface HydratedConfig {
  readonly deviceId: DeviceId;
  readonly mode: AppMode | null;
  readonly currentBusinessId: BusinessId | null;
  readonly notificationsEnabled: boolean;
  readonly crashReportingEnabled: boolean | null;
}

function parseBool(raw: string | null, fallback: boolean): boolean {
  if (raw === null) return fallback;
  return raw === 'true';
}

function parseNullableBool(raw: string | null): boolean | null {
  if (raw === null) return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return null;
}

/**
 * Read AppConfig.mode and migrate legacy values per ADR-039. Idempotent
 * — running on a fresh DB or on already-migrated data is a no-op.
 */
async function readAndMigrateMode(
  repo: AppConfigRepository,
  resolveLegacyLan: AppConfigProviderProps['resolveLegacyLan'],
): Promise<AppMode | null> {
  const raw = await repo.get(APP_CONFIG_KEYS.mode);
  const parsed = parseMode(raw);
  if (parsed === null) return null;
  if (parsed === 'legacy-lan') {
    const resolved = resolveLegacyLan ? await resolveLegacyLan() : 'lan-client';
    await repo.set(APP_CONFIG_KEYS.mode, resolved);
    return resolved;
  }
  // If parseMode normalised a legacy non-lan value, persist the new one
  // so subsequent reads skip the migration branch.
  if (parsed !== raw) {
    await repo.set(APP_CONFIG_KEYS.mode, parsed);
  }
  return parsed;
}

/**
 * Read the AppConfig keys + generate+persist a deviceId if missing.
 * Extracted out of the effect so the component body stays under the
 * 40-line function budget (CLAUDE.md §4.4).
 */
async function hydrateAppConfig(
  repo: AppConfigRepository,
  generateDeviceId: (() => DeviceId) | undefined,
  resolveLegacyLan: AppConfigProviderProps['resolveLegacyLan'],
): Promise<HydratedConfig> {
  const existingDeviceId = (await repo.get(APP_CONFIG_KEYS.deviceId)) as DeviceId | null;
  const deviceId = existingDeviceId ?? generateDeviceId?.() ?? newEntityId<DeviceId>();
  if (!existingDeviceId) {
    await repo.set(APP_CONFIG_KEYS.deviceId, deviceId);
  }
  const mode = await readAndMigrateMode(repo, resolveLegacyLan);
  const rawBusinessId = await repo.get(APP_CONFIG_KEYS.currentBusinessId);
  const notificationsEnabled = parseBool(
    await repo.get(APP_CONFIG_KEYS.notificationsEnabled),
    true,
  );
  const crashReportingEnabled = parseNullableBool(
    await repo.get(APP_CONFIG_KEYS.crashReportingEnabled),
  );
  return {
    deviceId,
    mode,
    currentBusinessId: rawBusinessId as BusinessId | null,
    notificationsEnabled,
    crashReportingEnabled,
  };
}

interface Setters {
  readonly setDeviceId: (v: DeviceId | null) => void;
  readonly setMode: (v: AppMode | null) => void;
  readonly setCurrentBusinessId: (v: BusinessId | null) => void;
  readonly setNotificationsEnabled: (v: boolean) => void;
  readonly setCrashReportingEnabled: (v: boolean | null) => void;
  readonly setHydrated: (v: boolean) => void;
}

function applyHydrated(c: HydratedConfig, s: Setters): void {
  s.setDeviceId(c.deviceId);
  s.setMode(c.mode);
  s.setCurrentBusinessId(c.currentBusinessId);
  s.setNotificationsEnabled(c.notificationsEnabled);
  s.setCrashReportingEnabled(c.crashReportingEnabled);
  s.setHydrated(true);
}

function useStoreSetters(): Setters {
  return {
    setDeviceId: useAppConfigStore((s) => s.setDeviceId),
    setMode: useAppConfigStore((s) => s.setMode),
    setCurrentBusinessId: useAppConfigStore((s) => s.setCurrentBusinessId),
    setNotificationsEnabled: useAppConfigStore((s) => s.setNotificationsEnabled),
    setCrashReportingEnabled: useAppConfigStore((s) => s.setCrashReportingEnabled),
    setHydrated: useAppConfigStore((s) => s.setHydrated),
  };
}

function useHydrateAppConfig(props: AppConfigProviderProps): boolean {
  const setters = useStoreSetters();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (props.skipHydration) {
      setters.setHydrated(true);
      setInitializing(false);
      return;
    }
    let mounted = true;
    void hydrateAppConfig(props.appConfig, props.generateDeviceId, props.resolveLegacyLan)
      .then((config) => {
        if (mounted) applyHydrated(config, setters);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });
    return () => {
      mounted = false;
    };
  }, [
    props.appConfig,
    props.generateDeviceId,
    props.skipHydration,
    props.resolveLegacyLan,
    setters,
  ]);

  return initializing;
}

export function AppConfigProvider(props: AppConfigProviderProps): ReactElement | null {
  const initializing = useHydrateAppConfig(props);
  const storeHydrated = useAppConfigStore((s) => s.hydrated);
  if (initializing || !storeHydrated) return null;
  return <>{props.children}</>;
}
