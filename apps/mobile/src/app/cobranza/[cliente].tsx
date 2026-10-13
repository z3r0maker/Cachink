/**
 * Expo Router entry for /cobranza/[cliente]: a client's account opens from
 * /fiado's own screen in the mostrador IA (M-08); the name stays as a redirect
 * for whatever still links here (M-12's redirect pattern).
 */
import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function ClienteRedirect(): ReactElement {
  return <Redirect href="/fiado" />;
}
