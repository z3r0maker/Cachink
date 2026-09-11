/**
 * DesktopAppShellWrapper — desktop-only thin adapter around the shared
 * `<AppShellRouteWrapper>` from `@cachink/ui`.
 *
 * Injects `DesktopRouterContext`'s `navigate` function as the
 * `navigate` prop so the shared wrapper never imports from
 * `desktop-router-context`. App-shell code per CLAUDE.md §5.6 —
 * belongs here, not in `packages/ui`.
 */

import type { ReactElement } from 'react';
import { AppShellRouteWrapper, type AppShellRouteWrapperProps } from '@cachink/ui';
import { useDesktopNavigate } from '../app/desktop-router-context';

// Re-export the props type under the legacy name so existing route
// files that import `DesktopAppShellWrapperProps` don't need updating.
export type DesktopAppShellWrapperProps = Omit<AppShellRouteWrapperProps, 'navigate'>;

export function DesktopAppShellWrapper(props: DesktopAppShellWrapperProps): ReactElement | null {
  const navigate = useDesktopNavigate();
  return <AppShellRouteWrapper {...props} navigate={navigate} />;
}
