/**
 * AppShellRouteWrapper — shared AppShell wiring consumed by both
 * `apps/mobile/src/shell/app-shell-wrapper.tsx` and
 * `apps/desktop/src/shell/desktop-app-shell-wrapper.tsx`.
 *
 * Each app shell keeps a thin platform adapter (~10 lines) that
 * injects its router's `navigate` function. All the role/mode/business
 * resolution and AppShell callback wiring lives here exactly once.
 *
 * Belongs in `packages/ui` because it imports only from within the
 * package — no `expo-router`, no `desktop-router-context`. See
 * CLAUDE.md §5.1.
 */

import type { ReactElement, ReactNode } from 'react';
import { AppShell } from '../../screens/AppShell/index';
import { useCurrentBusiness } from '../../hooks/use-current-business';
import { useFeatureFlags } from '../../hooks/use-feature-flags';
import { useMode, useRole, useSetRole } from '../../app-config/use-app-config';
import type { Role } from '../../app-config/types';

export interface AppShellRouteWrapperProps {
  readonly activeTabKey: string;
  readonly defaultRole?: Role;
  readonly title?: string;
  /**
   * When provided, the TopBar's left slot renders a ghost icon-only
   * back button instead of the role avatar. Pass on routes reached
   * from a parent screen (Settings, Cuentas por Cobrar, etc.).
   */
  readonly onBack?: () => void;
  /** Optional override for the back-button's accessible label. */
  readonly backLabel?: string;
  /**
   * Platform-injected navigate callback. On mobile this is
   * `(path) => router.push(path as never)`; on desktop it is the
   * `DesktopRouterContext`'s `navigate` function.
   */
  readonly navigate: (path: string) => void;
  /**
   * Platform-injected replace callback. On mobile this is
   * `(path) => router.replace(path)`. Used for bottom-tab switches
   * so tabs never stack — prevents the iOS back gesture from
   * "changing the page" when the user swipes inside a tabbed screen.
   * Falls back to `navigate` when omitted (desktop state-router has
   * no push/replace distinction).
   */
  readonly replaceRoute?: (path: string) => void;
  readonly children: ReactNode;
}

export function AppShellRouteWrapper(props: AppShellRouteWrapperProps): ReactElement | null {
  const role = useRole();
  const mode = useMode();
  const flags = useFeatureFlags();
  const business = useCurrentBusiness().data ?? null;
  const setRole = useSetRole();

  // GatedNavigation already ensures role is set before mounting any
  // tabbed route — this is a defensive fallback only.
  const resolvedRole: Role | null = role ?? props.defaultRole ?? null;
  if (!resolvedRole) return null;

  // Tab switches use replace so they never create a stack entry —
  // prevents iOS swipe-back from "changing the page."
  const tabNavigate = props.replaceRoute ?? props.navigate;

  return (
    <AppShell
      role={resolvedRole}
      activeTabKey={props.activeTabKey}
      mode={mode}
      flags={flags}
      title={props.title ?? business?.nombre ?? undefined}
      onBack={props.onBack}
      backLabel={props.backLabel}
      onNavigate={tabNavigate}
      onChangeRole={() => {
        setRole(null);
        tabNavigate('/role-picker');
      }}
      onOpenSettings={() => props.navigate('/settings')}
    >
      {props.children}
    </AppShell>
  );
}
