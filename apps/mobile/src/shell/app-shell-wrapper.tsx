/**
 * AppShellWrapper — mobile-only thin adapter around the shared
 * `<AppShellRouteWrapper>` from `@cachink/ui`.
 *
 * Injects Expo Router's `router.push` as the `navigate` prop so the
 * shared wrapper never imports from `expo-router`. App-shell code per
 * CLAUDE.md §5.6 — belongs here, not in `packages/ui`.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { AppShellRouteWrapper, type AppShellRouteWrapperProps } from '@cachink/ui';

// Re-export the props type under the legacy name so existing route
// files that import `AppShellWrapperProps` don't need updating.
export type AppShellWrapperProps = Omit<AppShellRouteWrapperProps, 'navigate'>;

export function AppShellWrapper(props: AppShellWrapperProps): ReactElement | null {
  const router = useRouter();
  return (
    <AppShellRouteWrapper
      {...props}
      navigate={(path) => router.push(path as never)}
    />
  );
}
