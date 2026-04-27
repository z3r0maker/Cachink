/**
 * Expo Router root index — role-aware home route (P1C-M10-T01).
 *
 * App-shell only per CLAUDE.md §5.6. Walks the role state and either
 * redirects to the Operativo's Ventas tab or renders the Director's
 * home inside `<AppShell>`. Pre-role boot states (null mode / null
 * business / null role) are handled by `<GatedNavigation>` inside
 * `<AppProviders>`, so this route is only reached once a role is set.
 *
 * Pre-C1 this file rendered the Phase 0 `<HelloBadge />` placeholder —
 * the plan's "close the HelloBadge gap" milestone is satisfied here.
 */

import { useEffect, type ReactElement } from 'react';
import { Redirect, useRouter } from 'expo-router';
import {
  AppShell,
  DirectorHomeRoute,
  useCurrentBusiness,
  useMode,
  useRole,
  useSetRole,
} from '@cachink/ui';

export default function HomeIndex(): ReactElement | null {
  const role = useRole();
  const router = useRouter();
  const mode = useMode();
  const business = useCurrentBusiness().data ?? null;
  const setRole = useSetRole();

  useEffect(() => {
    // Operativo lands on the Ventas tab — Expo Router's `<Redirect>` below
    // handles the initial navigation; this effect ensures subsequent role
    // changes (Cambiar rol flow) re-route even if the user is already on
    // `/`.
    if (role === 'operativo') {
      router.replace('/ventas');
    }
  }, [role, router]);

  if (role === null) {
    return <Redirect href="/role-picker" />;
  }
  if (role === 'operativo') {
    return <Redirect href="/ventas" />;
  }

  return (
    <AppShell
      role="director"
      activeTabKey="home"
      mode={mode}
      title={business?.nombre ?? undefined}
      onNavigate={(path) => router.push(path as never)}
      onChangeRole={() => {
        setRole(null);
        router.replace('/role-picker');
      }}
      onOpenSettings={() => router.push('/settings' as never)}
    >
      <DirectorHomeRoute onNavigate={(path) => router.push(path as never)} />
    </AppShell>
  );
}
