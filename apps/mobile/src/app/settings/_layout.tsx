/**
 * Settings group layout — a headerless Stack so the settings hub
 * and its sub-screens (negocio, tasas-isr, empleados, sistema)
 * push/pop naturally via `router.push` / `router.back()`.
 */

import type { ReactElement } from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout(): ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
