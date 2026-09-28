/**
 * AppShellWrapper — mobile-only thin adapter around the shared
 * `<AppShellRouteWrapper>` from `@xangarro/ui`.
 *
 * Injects Expo Router: `router.navigate` for every destination (it switches
 * tabs in place and pops back to a screen already on the stack instead of
 * piling copies), and the pathname, which lights the current destination in
 * the tab bar, the rail and the sidebar. It also gives the header its avisos
 * bell: the owner's unread messages, opening Avisos (M-09). App-shell code
 * per CLAUDE.md §5.6.
 */

import type { ReactElement } from 'react';
import { usePathname, useRouter } from 'expo-router';
import {
  AppShellRouteWrapper,
  useAvisosSinLeer,
  type AppShellRouteWrapperProps,
} from '@xangarro/ui';

export type AppShellWrapperProps = Omit<
  AppShellRouteWrapperProps,
  'navigate' | 'replaceRoute' | 'activeTabKey'
>;

export function AppShellWrapper(props: AppShellWrapperProps): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const go = (path: string): void => router.navigate(path as never);
  const sinLeer = useAvisosSinLeer();
  const avisos = props.avisos ?? { count: sinLeer, onPress: () => go('/avisos') };
  return (
    <AppShellRouteWrapper
      {...props}
      avisos={avisos}
      activeTabKey={pathname}
      navigate={go}
      replaceRoute={go}
    />
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
