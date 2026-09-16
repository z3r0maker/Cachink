/**
 * Root index inside the (tabs) group. The app is single-role (ADR-053):
 * every Operator lands on Ventas. The Director dashboard lives in the portal.
 */

import type { ReactElement } from 'react';
import { Redirect } from 'expo-router';

export default function HomeIndex(): ReactElement {
  return <Redirect href="/ventas" />;
}
