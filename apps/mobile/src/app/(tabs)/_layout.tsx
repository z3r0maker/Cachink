/**
 * The caja's four tabs (Track M, M-05): Inicio, Cobrar, Ventas, Mi turno.
 * Single role (ADR-053). The frame (header, tab bar, or the rail and the
 * sidebar on a tablet) is `AppShell`; Expo Router's own tab bar is hidden.
 * Gastos, Inventario, Movimientos, Por enviar and Ajustes are stack routes
 * opened from Mi turno.
 */

import type { ReactElement } from 'react';
import { Tabs } from 'expo-router';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function TabsLayout(): ReactElement {
  return (
    <AppShellWrapper>
      <Tabs screenOptions={{ headerShown: false }} tabBar={() => null} />
    </AppShellWrapper>
  );
}
