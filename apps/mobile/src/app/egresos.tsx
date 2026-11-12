/**
 * Expo Router entry for /egresos: the older Gastos list is gone, and the
 * caja's gastos are the El Mostrador screen at /gastos (M-08, board
 * MvGastos). This name stays so old links and notification payloads land
 * there (M-12's redirect pattern).
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function EgresosRedirect(): ReactElement {
  return <Redirect href="/gastos" />;
}
