/**
 * `useDesktopLanBridges` — composes the four desktop-side functions
 * the `LanGate` consumes (Slice 8 C2/C3):
 *
 *   - `pair` → JS-side `POST /api/v1/pair` (`lan-pair-bridge`)
 *   - `startServer` → Tauri command `lan_server_start` (`lan-host-bridge`)
 *   - `onPaired` / `onServerStarted` → shared persistence from
 *     `@cachink/ui/sync.useLanBridgeCallbacks`
 *   - `deviceId` → resolved from AppConfig
 *
 * The result drops directly into `<AppProviders lan={...}>`. Returns
 * `null` until the hydrated AppConfig has produced a `deviceId`; LanGate
 * holds the splash in that window so users never see a half-wired form.
 */

import { useMemo } from 'react';
import { useDeviceId, type LanBridges } from '@cachink/ui';
import { pairWithLanServer, useLanBridgeCallbacks } from '@cachink/ui/sync';
import { startLanServer } from './lan-host-bridge';

export function useDesktopLanBridges(): LanBridges | null {
  const deviceId = useDeviceId();
  const { onPaired, onServerStarted } = useLanBridgeCallbacks();
  return useMemo<LanBridges | null>(() => {
    if (!deviceId) return null;
    return {
      deviceId,
      pair: ({ serverUrl, pairingToken }) =>
        pairWithLanServer({
          serverUrl,
          pairingToken,
          deviceId,
        }),
      onPaired,
      startServer: () => startLanServer(),
      onServerStarted,
    };
  }, [deviceId, onPaired, onServerStarted]);
}
