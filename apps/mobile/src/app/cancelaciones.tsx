/**
 * /cancelaciones became the Ventas tab (Track M, M-05). Kept so an old link
 * still lands on the sales list.
 */

import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function CancelacionesRedirect(): ReactElement {
  return <Redirect href="/ventas" />;
}
