/**
 * Expo Router root layout for `apps/mobile`.
 *
 * App-shell only per CLAUDE.md §5.6. Responsibilities:
 *   1. Polyfill `crypto.getRandomValues` for Hermes (must be the
 *      VERY FIRST import — `ulid` reads it during module evaluation
 *      via `hydrateAppConfig`. See ADR-038.)
 *   2. Load Plus Jakarta Sans (the brand font — CLAUDE.md §8.2).
 *   3. Mount the Tamagui provider (required by every `@xangarro/ui`
 *      component).
 *   4. Pass the activation config (API base, secure token store) into
 *      `<AppProviders>`; cloud sync mounts there (A-04, A-07).
 *   5. Mount `<MobileScannerHost />` inside the provider tree so
 *      `openScannerForResult()` has a `<Scanner>` to show.
 *   6. Mount `` for Cloud overlay sub-screens
 *      (Advanced Backend, Password Reset).
 *   7. Wrap the tree in `<GestureHandlerRootView>` (Phase C1) so
 *      `<SwipeableRow>` and any future gesture-driven primitive can
 *      reach the gesture-handler module. The wrapper must sit at the
 *      root, not at the per-screen level (per
 *      https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation).
 *   8. Render the active route via `<Stack />`.
 *
 * No business UI lives here — that belongs to `@xangarro/ui` (shared
 * components) or to route files under `src/app/`.
 */

// Side-effect import — registers `globalThis.crypto.getRandomValues`
// before anything else evaluates. ULID generation in
// `app-config-provider.hydrateAppConfig` would otherwise throw
// `ULIDError: PRNG_DETECT` on Hermes.
import 'react-native-get-random-values';

// Polyfill: map unsupported TextDecoder encodings (e.g. 'ascii') to
// 'utf-8'. Must precede @react-pdf/renderer which requests 'ascii'.
import '../shell/text-decoder-polyfill';

import { LogBox } from 'react-native';
import { StrictMode, type ReactElement } from 'react';

// Victory Native XL + react-native-reanimated use deprecated StrictMode
// APIs internally — harmless but noisy. Suppress until upstream fixes land.
LogBox.ignoreLogs(['findHostInstance_DEPRECATED', 'findNodeHandle is deprecated']);
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AppProviders, StockLowScheduleHost } from '@xangarro/ui';
import { bootstrapI18n } from '../shell/i18n';
import { MobileScannerHost } from '../shell/scanner-host';
import { NotificationTapHost } from '../shell/notification-tap-host';
import { useMobileDeviceContext } from '../shell/use-device-context';
import { mobileActivationConfig } from '../shell/activation-config';

// Initialize i18n once at module load — initI18n is idempotent so Fast
// Refresh re-evaluations are safe.
bootstrapI18n();

// Plus Jakarta Sans ships weights 200–800 on Google Fonts. CLAUDE.md
// §8.2 mentions 900 as the heading weight; when the CSS requests 900
// the browser / RN runtime snaps to the closest available weight (800
// ExtraBold).
/** All Expo Router screens — extracted to keep RootLayout under 40 lines. */
function MobileStack(): ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="wizard" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="cuentas-por-cobrar" />
      <Stack.Screen name="inventario" />
      <Stack.Screen name="caja" />
      <Stack.Screen name="conversion" />
      <Stack.Screen name="auditoria" />
      <Stack.Screen name="ventas-credito" />
    </Stack>
  );
}

export default function RootLayout(): ReactElement | null {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const deviceContext = useMobileDeviceContext();
  if (!fontsLoaded) return null;
  return (
    <StrictMode>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AppProviders
            platform="mobile"
            deviceContext={deviceContext}
            activation={mobileActivationConfig}
            overlays={
              <>
                <MobileScannerHost />
                <NotificationTapHost />
                <StockLowScheduleHost />
              </>
            }
          >
            <MobileStack />
          </AppProviders>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StrictMode>
  );
}
