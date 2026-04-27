/**
 * Expo Router root layout for `apps/mobile`.
 *
 * App-shell only per CLAUDE.md §5.6. Responsibilities:
 *   1. Polyfill `crypto.getRandomValues` for Hermes (must be the
 *      VERY FIRST import — `ulid` reads it during module evaluation
 *      via `hydrateAppConfig`. See ADR-038.)
 *   2. Load Plus Jakarta Sans (the brand font — CLAUDE.md §8.2).
 *   3. Mount the Tamagui provider (required by every `@cachink/ui`
 *      component).
 *   4. Pass the mobile LAN + Cloud bridge factories into
 *      `<AppProviders>` so `LanGate` + `CloudGate` render end-to-end
 *      (Slice 9.5 T05 + 9.6 T06).
 *   5. Mount `<MobileScannerHost />` inside the provider tree so the
 *      LAN bridge's `onOpenScanner()` promise has a `<Scanner>` to
 *      show (expo-camera-backed).
 *   6. Mount `<CloudInnerScreenHost />` for Cloud overlay sub-screens
 *      (Advanced Backend, Password Reset).
 *   7. Wrap the tree in `<GestureHandlerRootView>` (Phase C1) so
 *      `<SwipeableRow>` and any future gesture-driven primitive can
 *      reach the gesture-handler module. The wrapper must sit at the
 *      root, not at the per-screen level (per
 *      https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation).
 *   8. Render the active route via `<Stack />`.
 *
 * No business UI lives here — that belongs to `@cachink/ui` (shared
 * components) or to route files under `src/app/`.
 */

// Side-effect import — registers `globalThis.crypto.getRandomValues`
// before anything else evaluates. ULID generation in
// `app-config-provider.hydrateAppConfig` would otherwise throw
// `ULIDError: PRNG_DETECT` on Hermes.
import 'react-native-get-random-values';

import type { ReactElement } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AppProviders, type AppProvidersHooks } from '@cachink/ui';
import { useLanHandle } from '@cachink/ui/sync';
import { bootstrapI18n } from '../shell/i18n';
import { useMobileLanBridges } from '../shell/use-lan-bridges';
import { useMobileCloudBridges } from '../shell/use-cloud-bridges';
import { useMobileCloudHandle } from '../shell/use-cloud-handle';
import { MobileScannerHost } from '../shell/scanner-host';
import { CloudInnerScreenHost } from '../shell/cloud-navigation';

// Initialize i18n once at module load — initI18n is idempotent so Fast
// Refresh re-evaluations are safe.
bootstrapI18n();

const mobileHooks: AppProvidersHooks = {
  useLan: useMobileLanBridges,
  useLanHandle,
  useCloud: useMobileCloudBridges,
  useCloudHandle: useMobileCloudHandle,
};

// Plus Jakarta Sans ships weights 200–800 on Google Fonts. CLAUDE.md
// §8.2 mentions 900 as the heading weight; when the CSS requests 900
// the browser / RN runtime snaps to the closest available weight (800
// ExtraBold).
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProviders
          platform="mobile"
          hooks={mobileHooks}
          overlays={
            <>
              <MobileScannerHost />
              <CloudInnerScreenHost />
            </>
          }
        >
          <Stack screenOptions={{ headerShown: false }} />
        </AppProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
