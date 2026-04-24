/**
 * AppConfigProvider — hydrates the Zustand store from the
 * {@link AppConfigRepository} on mount.
 *
 * Responsibilities (CLAUDE.md §7.5 singleton table):
 *   1. Read `deviceId`; if missing, generate a ULID-branded DeviceId and
 *      persist it back. This fires once per install and is never reset.
 *   2. Read `mode`; narrow it to a valid {@link AppMode} via `parseMode`
 *      — rogue values (from a stale app version or hand-edited DB) become
 *      null so the wizard re-runs.
 *   3. Read `currentBusinessId`; leave as-is (string-branded; null means
 *      no business has been created yet).
 *   4. Flip `hydrated = true` on the store. Consumers gate their boot
 *      behaviour on this value via {@link useAppConfigHydrated}.
 *
 * Rendering contract: while `hydrated === false` the provider returns
 * `null` so the splash / TauriWindow background stays visible. Children
 * only mount once the three values are in the store.
 */

import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { newEntityId, type BusinessId, type DeviceId } from '@cachink/domain';
import type { AppConfigRepository } from '@cachink/data';
import { useAppConfigStore } from './use-app-config';
import { APP_CONFIG_KEYS, parseMode } from './types';

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
  readonly mode: ReturnType<typeof parseMode>;
  readonly currentBusinessId: BusinessId | null;
}

/**
 * Read the three AppConfig keys + generate+persist a deviceId if missing.
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
  const mode = parseMode(await repo.get(APP_CONFIG_KEYS.mode));
  const rawBusinessId = await repo.get(APP_CONFIG_KEYS.currentBusinessId);
  return {
    deviceId,
    mode,
    currentBusinessId: rawBusinessId as BusinessId | null,
  };
}

export function AppConfigProvider(props: AppConfigProviderProps): ReactElement | null {
  const setDeviceId = useAppConfigStore((s) => s.setDeviceId);
  const setMode = useAppConfigStore((s) => s.setMode);
  const setCurrentBusinessId = useAppConfigStore((s) => s.setCurrentBusinessId);
  const setHydrated = useAppConfigStore((s) => s.setHydrated);
  const storeHydrated = useAppConfigStore((s) => s.hydrated);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (props.skipHydration) {
      setHydrated(true);
      setInitializing(false);
      return;
    }
    let mounted = true;
    void hydrateAppConfig(props.appConfig, props.generateDeviceId)
      .then((config) => {
        if (!mounted) return;
        setDeviceId(config.deviceId);
        setMode(config.mode);
        setCurrentBusinessId(config.currentBusinessId);
        setHydrated(true);
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
    setCurrentBusinessId,
    setDeviceId,
    setHydrated,
    setMode,
  ]);

  if (initializing || !storeHydrated) return null;
  return <>{props.children}</>;
}
