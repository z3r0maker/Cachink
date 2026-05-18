/**
 * `useIsOnline` — React Native (mobile) variant (ADR-039).
 *
 * Wraps `@react-native-community/netinfo`'s `useNetInfo` hook. Returns
 * `true` when both `isConnected` and `isInternetReachable` look healthy;
 * defensive default is `true` so a missing-NetInfo dev environment does
 * not soft-lock the user.
 *
 * Lazy-imports NetInfo so the bundler doesn't pull it into desktop
 * builds. On mobile, Expo's autolinking already includes the package.
 */

import { useEffect, useRef, useState } from 'react';
import { ulid } from 'ulid';
import type { AuditEvent, AuditOperation } from '@cachink/observability';
import { useLogStore } from '../observability/observability-provider';
import { useDeviceId } from '../app-config/index';

interface NetInfoState {
  readonly isConnected: boolean | null;
  readonly isInternetReachable: boolean | null;
}

type NetInfoModule = {
  addEventListener: (cb: (s: NetInfoState) => void) => () => void;
  fetch: () => Promise<NetInfoState>;
};

async function loadNetInfo(): Promise<NetInfoModule | null> {
  try {
    // @ts-expect-error — optional peer dep; only resolved on mobile builds.
    const mod = await import('@react-native-community/netinfo');
    const candidate = (mod as { default?: NetInfoModule }).default ?? (mod as NetInfoModule);
    return candidate;
  } catch {
    return null;
  }
}

function isOnlineFromState(state: NetInfoState | null): boolean {
  if (!state) return true;
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function useIsOnline(): boolean {
  const [state, setState] = useState<NetInfoState | null>(null);
  const logStore = useLogStore();
  const deviceId = useDeviceId();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    void loadNetInfo().then((mod) => {
      if (cancelled || !mod) return;
      void mod.fetch().then((initial) => {
        if (!cancelled) setState(initial);
      });
      unsubscribe = mod.addEventListener((next) => {
        if (!cancelled) setState(next);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const online = isOnlineFromState(state);

  // Phase 9: Log connectivity transitions
  const prevOnline = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevOnline.current === null) {
      // Skip the initial state — only log transitions
      prevOnline.current = online;
      return;
    }
    if (prevOnline.current === online) return;
    prevOnline.current = online;

    if (!logStore || !deviceId) return;
    const op: AuditOperation = online ? 'network.online' : 'network.offline';
    const event: AuditEvent = {
      id: ulid(),
      timestamp: new Date().toISOString(),
      operation: op,
      entityType: 'connectivity',
      entityId: '',
      userId: null,
      deviceId,
      businessId: '',
      status: 'success',
    };
    void logStore.writeAudit(event).catch(() => {});
  }, [online, logStore, deviceId]);

  return online;
}
