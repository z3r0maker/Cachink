/**
 * Expo Router entry for /inventario: the mostrador IA keeps stock at
 * /productos (M-09); this name stays so old links land there (M-12's
 * redirect pattern).
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function InventarioRedirect(): ReactElement {
  return <Redirect href="/productos" />;
}
