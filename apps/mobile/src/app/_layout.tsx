/**
 * Expo Router root layout for `apps/mobile`.
 *
 * App-shell only per CLAUDE.md §5.6. Responsibilities:
 *   1. Load Plus Jakarta Sans (the brand font — CLAUDE.md §8.2).
 *   2. Mount the Tamagui provider (required by every `@cachink/ui` component).
 *   3. Render the active route via `<Stack />`.
 *
 * No business UI lives here — that belongs to `@cachink/ui` (shared
 * components) or to route files under `src/app/`.
 */

import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AppProviders } from '@cachink/ui';
import { bootstrapI18n } from '../shell/i18n';

// Initialize i18n once at module load — initI18n is idempotent so Fast
// Refresh re-evaluations are safe.
bootstrapI18n();

// Plus Jakarta Sans ships weights 200–800 on Google Fonts. CLAUDE.md §8.2
// mentions 900 as the heading weight; when the CSS requests 900 the browser /
// RN runtime snaps to the closest available weight (800 ExtraBold).
export default function RootLayout(): ReactElement | null {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) {
    // Return null while fonts load so Expo Router shows the splash screen.
    return null;
  }

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
