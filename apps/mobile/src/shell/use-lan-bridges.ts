/**
 * `useMobileLanBridges` — mobile counterpart to
 * `apps/desktop/src/shell/use-lan-bridges.ts` (Slice 9, Phase B1).
 *
 * Composes the three mobile-side functions the `LanGate` consumes:
 *   - `pair` → shared `pairWithLanServer` (`@cachink/ui/sync`)
 *   - `onPaired` → shared `useLanBridgeCallbacks` (same as desktop)
 *   - `onOpenScanner` → `openScannerForResult` (mobile-only —
 *     drives the expo-camera-backed `<Scanner>` modal rendered by
 *     `<MobileScannerHost />` in `_layout.tsx`).
 *
 * `startServer` and `onServerStarted` are omitted intentionally —
 * the Wizard on mobile hides the "Ser el servidor local" card, and
 * only the desktop app bundles the Rust LAN server via Tauri.
 *
 * Returns `null` until the hydrated AppConfig has produced a
 * `deviceId`. `LanGate` holds the splash during that window so the
 * user never sees a half-wired form.
 */

import { useMemo } from 'react';
import { useDeviceId, type LanBridges } from '@cachink/ui';
import { pairWithLanServer, useLanBridgeCallbacks } from '@cachink/ui/sync';
import { openScannerForResult } from './scanner-host';

export function useMobileLanBridges(): LanBridges | null {
  const deviceId = useDeviceId();
  const { onPaired } = useLanBridgeCallbacks();
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
      onOpenScanner: () => openScannerForResult(),
    };
  }, [deviceId, onPaired]);
}
