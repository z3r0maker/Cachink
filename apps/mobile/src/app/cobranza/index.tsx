/**
 * Expo Router entry for /cobranza: the Fiado y abonos list lives at /fiado in
 * the mostrador IA (M-08); this name stays so links and notifications that
 * still say /cobranza land somewhere real (M-12's redirect pattern).
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function CobranzaRedirect(): ReactElement {
  return <Redirect href="/fiado" />;
}
