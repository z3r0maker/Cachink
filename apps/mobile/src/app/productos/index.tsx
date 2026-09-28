/**
 * /productos became /inventario (Track M, M-09). Kept so old links (stock
 * notifications, Maestro flows) land.
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function ProductosRedirect(): ReactElement {
  return <Redirect href="/inventario" />;
}
