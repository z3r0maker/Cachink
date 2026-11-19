/**
 * Expo Router entry for /caja-movimientos: Mi turno no longer links here (R2,
 * approved 2026-11-19), because nothing records a deposit or a withdrawal yet
 * and the list was always empty. The name stays so old links land on Mi turno
 * (M-12's redirect pattern).
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function CajaMovimientosRedirect(): ReactElement {
  return <Redirect href="/turno" />;
}
