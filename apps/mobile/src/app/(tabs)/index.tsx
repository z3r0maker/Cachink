/**
 * Root index inside the (tabs) group: the caja lands on Inicio (Track M,
 * M-06), which answers «what do I do now» and opens Cobrar from its card.
 */

import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function HomeIndex(): ReactElement {
  return <Redirect href="/inicio" />;
}
