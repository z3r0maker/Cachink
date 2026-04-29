/**
 * useActiveTabKey — resolves the current Expo Router pathname to the
 * matching BottomTabBar tab key (UXD-R3 E2, ADR-047).
 *
 * Off-tab screens (Settings, Cuentas por Cobrar, Producto detail)
 * light up the parent tab. When no match is found (pre-auth routes),
 * returns an empty string (no tab highlighted).
 */

import { usePathname } from 'expo-router';

const PATH_TO_TAB: Record<string, string> = {
  '/': 'home',
  '/ventas': 'ventas',
  '/ventas/avanzada': 'ventas',
  '/egresos': 'egresos',
  '/productos': 'productos',
  '/productos/movimientos': 'productos',
  '/clientes': 'ventas',
  '/cuentas-por-cobrar': 'home',
  '/estados': 'estados',
  '/settings': 'ajustes',
  '/wizard': '',
  '/role-picker': '',
};

export function useActiveTabKey(): string {
  const pathname = usePathname();
  // Direct match first
  if (PATH_TO_TAB[pathname] !== undefined) {
    return PATH_TO_TAB[pathname]!;
  }
  // Fall back to the first path segment
  const firstSegment = `/${pathname.split('/')[1] ?? ''}`;
  return PATH_TO_TAB[firstSegment] ?? '';
}
