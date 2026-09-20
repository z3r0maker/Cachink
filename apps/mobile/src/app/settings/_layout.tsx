/**
 * Settings group layout — a headerless Stack for the single device-only
 * Configuración screen (A-12).
 */

import type { ReactElement } from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout(): ReactElement {
  return <Stack screenOptions={{ headerShown: false }} />;
}
