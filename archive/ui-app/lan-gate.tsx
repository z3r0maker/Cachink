/**
 * LanGate — boot-time state machine branch for `mode === 'lan-server'`
 * or `mode === 'lan-client'` (Slice 8 C1, ADR-039).
 *
 * Renders:
 *   - `<LanHostScreen />` when `mode === 'lan-server'` AND the desktop
 *     shell provided a `startServer` bridge.
 *   - `<LanJoinScreen />` for the client flow (`mode === 'lan-client'`).
 *     The mobile shell plugs the `BarcodeScanner` here via
 *     `onOpenScanner`.
 *   - `children` once a LAN access token (clients) or `lanHostReady`
 *     flag (hosts) exists — the device has paired or hosted and should
 *     proceed to BusinessGate / RoleGate like any other mode.
 *
 * The pre-ADR-039 `useLanRole` indirection is retired — routing now
 * derives directly from AppMode. See ARCHITECTURE.md "Deferred
 * Decisions" (`useLanRole` retirement).
 */

import type { ReactElement, ReactNode } from 'react';
import type {
  LanHostScreenProps,
  LanHostStartResult,
  LanJoinScreenProps,
  LanPairSuccess,
} from '../screens/LanPairing/index';
import { LanHostScreen, LanJoinScreen } from '../screens/LanPairing/index';
import { useLanAuthToken, useLanHostReady } from '../hooks/use-lan-auth';

export interface LanBridges {
  /** Called by the LanJoinScreen to pair with a discovered LAN server. */
  readonly pair: LanJoinScreenProps['pair'];
  /** Called after a successful pair — persist token + invalidate queries. */
  readonly onPaired: (payload: LanPairSuccess) => void | Promise<void>;
  /** Mobile-only: opens the camera-backed QR scanner. Desktop omits this. */
  readonly onOpenScanner?: LanJoinScreenProps['onOpenScanner'];
  /** Desktop-only: boots the Rust LAN server via Tauri invoke. */
  readonly startServer?: LanHostScreenProps['startServer'];
  /** Desktop-only: called once the LAN server is running and ready. */
  readonly onServerStarted?: (result: LanHostStartResult) => void | Promise<void>;
  /** Per-device ULID — mobile shell reads this from AppConfig. */
  readonly deviceId: string;
}

export interface LanGateProps {
  readonly bridges: LanBridges | null;
  readonly children: ReactNode;
  /** Routing comes from AppMode directly — ADR-039. */
  readonly mode: 'lan-server' | 'lan-client';
}

export function LanGate(props: LanGateProps): ReactElement | null {
  const { token, loading: tokenLoading } = useLanAuthToken();
  const { ready: hostReady, loading: hostReadyLoading } = useLanHostReady();

  if (tokenLoading || hostReadyLoading) return null;

  // Past-setup paths fall through to children.
  const isPairedClient = props.mode === 'lan-client' && !!token;
  const isReadyHost = props.mode === 'lan-server' && hostReady;
  if (isPairedClient || isReadyHost) return <>{props.children}</>;

  if (!props.bridges) return null;

  const wantsHost = props.mode === 'lan-server' && props.bridges.startServer !== undefined;
  if (wantsHost) {
    const startServer = props.bridges.startServer!;
    const onContinue = props.bridges.onServerStarted ?? (() => undefined);
    return <LanHostScreen startServer={startServer} onContinue={onContinue} />;
  }

  return (
    <LanJoinScreen
      deviceId={props.bridges.deviceId}
      pair={props.bridges.pair}
      onPaired={props.bridges.onPaired}
      onOpenScanner={props.bridges.onOpenScanner}
    />
  );
}
