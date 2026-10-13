/**
 * /caja is Mi turno now (Track M, M-05). Kept so an old link or a
 * notification that still names /caja lands in the right place.
 */

import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function CajaRedirect(): ReactElement {
  return <Redirect href="/turno" />;
}
