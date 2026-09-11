/**
 * `DesktopRouterContext` — state-based path + navigate for the Tauri
 * app's state router. Extracted into its own module so both the router
 * (`desktop-router.tsx`) and the shell wrapper
 * (`shell/desktop-app-shell-wrapper.tsx`) can consume it without
 * importing each other and creating a cycle.
 *
 * `useDesktopNavigate()` returns the stable `navigate` function that
 * route adapters use in place of Expo Router's `useRouter()`. Calling
 * the hook outside a provider throws — matching Expo Router's UX so
 * mistakes surface at mount time instead of as silent no-ops.
 */

import { createContext, useContext } from 'react';

export interface DesktopRouterContextValue {
  readonly path: string;
  readonly navigate: (path: string) => void;
}

export const DesktopRouterContext = createContext<DesktopRouterContextValue | null>(null);

export function useDesktopRouter(): DesktopRouterContextValue {
  const ctx = useContext(DesktopRouterContext);
  if (!ctx) {
    throw new Error('useDesktopRouter must be used inside <DesktopRouterContext.Provider>');
  }
  return ctx;
}

export function useDesktopNavigate(): (path: string) => void {
  return useDesktopRouter().navigate;
}

export function useDesktopPath(): string {
  return useDesktopRouter().path;
}
