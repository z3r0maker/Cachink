/**
 * Root index inside the (tabs) group — role-aware home (P1C-M10-T01).
 *
 * The persistent `(tabs)/_layout.tsx` provides the AppShell; this file
 * renders ONLY the content area:
 *   - Director → `<DirectorHomeRoute>` (dashboard)
 *   - Operativo → `<Redirect href="/ventas" />` (ventas is the landing
 *     tab for Operativo per CLAUDE.md §1)
 */

import { useEffect, type ReactElement } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { DirectorHomeRoute, useRole } from '@cachink/ui';

export default function HomeIndex(): ReactElement | null {
  const role = useRole();
  const router = useRouter();

  useEffect(() => {
    // Ensure subsequent role changes (Cambiar rol flow) re-route even
    // if the user is already on `/`.
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
    <DirectorHomeRoute onNavigate={(path) => router.push(path as never)} />
  );
}
