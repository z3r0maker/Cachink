/**
 * AppShellWrapper — mobile-only thin adapter around the shared
 * `<AppShellRouteWrapper>` from `@xangarro/ui`.
 *
 * Injects Expo Router: `router.navigate` for every destination (it switches
 * tabs in place), and the pathname, which lights the current destination in
 * the tab bar, the rail and the sidebar. A destination is a place, not a
 * step: from a stack route (Inventario over Mi turno) the stack is dismissed
 * first, or the tabs would open a second time on top of it and a later
 * `dismissAll` (the cobro's) would land on the first copy, still on Mi turno.
 * App-shell code per CLAUDE.md §5.6.
 */

import type { ReactElement } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { AppShellRouteWrapper, type AppShellRouteWrapperProps } from '@xangarro/ui';

export type AppShellWrapperProps = Omit<
  AppShellRouteWrapperProps,
  'navigate' | 'replaceRoute' | 'activeTabKey'
>;

export function AppShellWrapper(props: AppShellWrapperProps): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const go = (path: string): void => {
    if (router.canDismiss()) router.dismissAll();
    router.navigate(path as never);
  };
  return (
    <AppShellRouteWrapper {...props} activeTabKey={pathname} navigate={go} replaceRoute={go} />
  );
}

/**
 * The back action of a stack route: pop when there is somewhere to pop to,
 * otherwise land on `fallback` (a deep link or a notification opened it).
 */
export function useBackTo(fallback: string): () => void {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  };
}
