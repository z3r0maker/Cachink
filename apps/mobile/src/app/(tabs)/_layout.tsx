/**
 * The caja's four tabs (Track M, M-05): Inicio, Cobrar, Ventas, Mi turno.
 * Single role (ADR-053). The frame (header, tab bar, or the rail and the
 * sidebar on a tablet) is `AppShell`; Expo Router's own tab bar is hidden.
 * Gastos, Inventario, Movimientos, No enviados and Ajustes are stack routes
 * opened from Mi turno. The header bell counts the unread avisos (M-09).
 */

import type { ReactElement } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAvisos, type AvisosSource } from '@xangarro/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

/** The bell's count and destination: unread avisos, or hidden when none. */
function useCampana(): AvisosSource | undefined {
  const router = useRouter();
  const a = useAvisos();
  if (a.state !== 'happy' || a.data === null) return undefined;
  const sinLeer = a.data.avisos.filter((x) => !x.leido).length;
  return { count: sinLeer, onPress: () => router.navigate('/avisos' as never) };
}

export default function TabsLayout(): ReactElement {
  const avisos = useCampana();
  return (
    <AppShellWrapper avisos={avisos}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={() => null} />
    </AppShellWrapper>
  );
}
