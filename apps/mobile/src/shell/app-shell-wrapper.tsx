/**
 * AppShellWrapper — mobile-only helper that wraps any route in the
 * shared `<AppShell>` with standard router callbacks (Cambiar rol,
 * Abrir ajustes, tab navigation). App-shell code per CLAUDE.md §5.6 —
 * belongs in `apps/mobile/src/shell/`, not in `packages/ui`.
 *
 * Centralises the callback wiring so each route file is thin. Desktop
 * ships its own equivalent in `apps/desktop/src/app/main.tsx`.
 */

import type { ReactElement, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { AppShell, useCurrentBusiness, useMode, useRole, useSetRole, type Role } from '@cachink/ui';

export interface AppShellWrapperProps {
  readonly activeTabKey: string;
  readonly defaultRole?: Role;
  readonly title?: string;
  readonly children: ReactNode;
}

export function AppShellWrapper(props: AppShellWrapperProps): ReactElement | null {
  const router = useRouter();
  const role = useRole();
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const setRole = useSetRole();

  // GatedNavigation already ensures role is set before mounting any
  // tabbed route, so this is a defensive fallback only.
  const resolvedRole: Role | null = role ?? props.defaultRole ?? null;
  if (!resolvedRole) return null;

  return (
    <AppShell
      role={resolvedRole}
      activeTabKey={props.activeTabKey}
      mode={mode}
      title={props.title ?? business?.nombre ?? undefined}
      onNavigate={(path) => router.push(path as never)}
      onChangeRole={() => {
        setRole(null);
        router.replace('/role-picker');
      }}
      onOpenSettings={() => router.push('/settings' as never)}
    >
      {props.children}
    </AppShell>
  );
}
