/**
 * Expo Router entry for /pendientes: the queue's face is /no-enviados in the
 * mostrador IA (M-09); this name stays so old links land there (M-12's
 * redirect pattern).
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function PendientesRedirect(): ReactElement {
  return <Redirect href="/no-enviados" />;
}
