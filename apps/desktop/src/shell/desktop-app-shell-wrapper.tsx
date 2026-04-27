/**
 * DesktopAppShellWrapper — desktop counterpart to the mobile
 * `AppShellWrapper`. App-shell code per CLAUDE.md §5.6 — belongs in
 * `apps/desktop/src/shell/`, not in `packages/ui`.
 *
 * Reads the active path + navigate function from `DesktopRouterContext`
 * so each route adapter stays free of router plumbing. Mirrors the
 * mobile wrapper's responsibilities (role / mode / business resolution
 * + onChangeRole + onOpenSettings + tab navigation).
 *
 * The desktop "router" is a plain useState hash on a context, so
 * navigation is just calling `navigate(path)` — no router.push /
 * router.replace distinction. Role reset and wizard re-run both use
 * the same `navigate(...)` function.
 */

import type { ReactElement, ReactNode } from 'react';
import { AppShell, useCurrentBusiness, useMode, useRole, useSetRole, type Role } from '@cachink/ui';
import { useDesktopNavigate } from '../app/desktop-router-context';

export interface DesktopAppShellWrapperProps {
  readonly activeTabKey: string;
  readonly defaultRole?: Role;
  readonly title?: string;
  readonly children: ReactNode;
}

export function DesktopAppShellWrapper(props: DesktopAppShellWrapperProps): ReactElement | null {
  const navigate = useDesktopNavigate();
  const role = useRole();
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const setRole = useSetRole();

  const resolvedRole: Role | null = role ?? props.defaultRole ?? null;
  if (!resolvedRole) return null;

  return (
    <AppShell
      role={resolvedRole}
      activeTabKey={props.activeTabKey}
      mode={mode}
      title={props.title ?? business?.nombre ?? undefined}
      onNavigate={navigate}
      onChangeRole={() => {
        setRole(null);
        navigate('/role-picker');
      }}
      onOpenSettings={() => navigate('/settings')}
    >
      {props.children}
    </AppShell>
  );
}
