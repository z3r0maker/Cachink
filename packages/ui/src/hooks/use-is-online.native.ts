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

import { useEffect, useState } from 'react';

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
  return isOnlineFromState(state);
}
