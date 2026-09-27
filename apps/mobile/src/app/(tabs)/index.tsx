/**
 * Root index inside the (tabs) group. The operator lands on Cobrar, as the
 * register always has, until Inicio is built (M-06: «Para hoy»); then Inicio
 * becomes the landing and this redirect goes.
 */

import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function HomeIndex(): ReactElement {
  return <Redirect href="/cobrar" />;
}
