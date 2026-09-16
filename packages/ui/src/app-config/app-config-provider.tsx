/**
 * AppConfigProvider — hydrates the Zustand store from the
 * {@link AppConfigRepository} on mount. Retired mode values (including
 * the LAN modes, A-18) are rewritten to `'local'` in place.
 *
 * Returns `null` while hydrating so the splash stays visible; children
 * mount once `hydrated === true`.
 */

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { newEntityId, ISR_DEFAULTS_SEED, type BusinessId, type DeviceId } from '@xangarro/domain';
import type { AppConfigRepository } from '@xangarro/data';
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
}

interface HydratedConfig {
  readonly deviceId: DeviceId;
  readonly mode: AppMode | null;
  readonly currentBusinessId: BusinessId | null;
  readonly notificationsEnabled: boolean;
  readonly crashReportingEnabled: boolean | null;
  readonly cachinkSoundEnabled: boolean;
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
async function readAndMigrateMode(repo: AppConfigRepository): Promise<AppMode | null> {
  const raw = await repo.get(APP_CONFIG_KEYS.mode);
  if (raw === null) {
    // Fresh install (review items #1/#2). A first-time user should not
    // be asked whether they want LAN or cloud before they have even
    // seen the app — they have one phone and no idea what those words
    // mean. Boot straight into local and let them find
    // Configuración → Sistema → "Sincronización y dispositivos" when
    // they actually get a second device.
    //
    // This branch keys on `raw === null`, NOT on `parsed === null`:
    // an existing LAN or cloud install must keep its stored mode, and
    // an unparseable value must still fall through to the wizard
    // rather than being silently rewritten to local.
    await repo.set(APP_CONFIG_KEYS.mode, 'local');
    return 'local';
  }
  const parsed = parseMode(raw);
  if (parsed === null) return null;
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
): Promise<HydratedConfig> {
  const existingDeviceId = (await repo.get(APP_CONFIG_KEYS.deviceId)) as DeviceId | null;
  const deviceId = existingDeviceId ?? generateDeviceId?.() ?? newEntityId<DeviceId>();
  if (!existingDeviceId) {
    await repo.set(APP_CONFIG_KEYS.deviceId, deviceId);
  }
  // Seed ISR defaults on first run so the DB owns the rates.
  const existingIsrDefaults = await repo.get(APP_CONFIG_KEYS.isrDefaults);
  if (!existingIsrDefaults) {
    await repo.set(APP_CONFIG_KEYS.isrDefaults, JSON.stringify(ISR_DEFAULTS_SEED));
  }

  const mode = await readAndMigrateMode(repo);
  const rawBusinessId = await repo.get(APP_CONFIG_KEYS.currentBusinessId);
  const notificationsEnabled = parseBool(
    await repo.get(APP_CONFIG_KEYS.notificationsEnabled),
    true,
  );
  const crashReportingEnabled = parseNullableBool(
    await repo.get(APP_CONFIG_KEYS.crashReportingEnabled),
  );
  const cachinkSoundEnabled = parseBool(await repo.get(APP_CONFIG_KEYS.cachinkSoundEnabled), true);
  return {
    deviceId,
    mode,
    currentBusinessId: rawBusinessId as BusinessId | null,
    notificationsEnabled,
    crashReportingEnabled,
    cachinkSoundEnabled,
  };
}

interface Setters {
  readonly setDeviceId: (v: DeviceId | null) => void;
  readonly setMode: (v: AppMode | null) => void;
  readonly setCurrentBusinessId: (v: BusinessId | null) => void;
  readonly setNotificationsEnabled: (v: boolean) => void;
  readonly setCrashReportingEnabled: (v: boolean | null) => void;
  readonly setCachinkSoundEnabled: (v: boolean) => void;
  readonly setHydrated: (v: boolean) => void;
}

function applyHydrated(c: HydratedConfig, s: Setters): void {
  s.setDeviceId(c.deviceId);
  s.setMode(c.mode);
  s.setCurrentBusinessId(c.currentBusinessId);
  s.setNotificationsEnabled(c.notificationsEnabled);
  s.setCrashReportingEnabled(c.crashReportingEnabled);
  s.setCachinkSoundEnabled(c.cachinkSoundEnabled);
  s.setHydrated(true);
}

function useStoreSetters(): Setters {
  return {
    setDeviceId: useAppConfigStore((s) => s.setDeviceId),
    setMode: useAppConfigStore((s) => s.setMode),
    setCurrentBusinessId: useAppConfigStore((s) => s.setCurrentBusinessId),
    setNotificationsEnabled: useAppConfigStore((s) => s.setNotificationsEnabled),
    setCrashReportingEnabled: useAppConfigStore((s) => s.setCrashReportingEnabled),
    setCachinkSoundEnabled: useAppConfigStore((s) => s.setCachinkSoundEnabled),
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
    void hydrateAppConfig(props.appConfig, props.generateDeviceId)
      .then((config) => {
        if (mounted) applyHydrated(config, setters);
      })
      .finally(() => {
        if (mounted) setInitializing(false);
      });
    return () => {
      mounted = false;
    };
  }, [props.appConfig, props.generateDeviceId, props.skipHydration, setters]);

  return initializing;
}

export function AppConfigProvider(props: AppConfigProviderProps): ReactElement | null {
  const initializing = useHydrateAppConfig(props);
  const storeHydrated = useAppConfigStore((s) => s.hydrated);
  if (initializing || !storeHydrated) return null;
  return <>{props.children}</>;
}
