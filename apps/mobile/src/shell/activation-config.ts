/**
 * Mobile ActivationConfig (A-04): secure token store, device info from
 * expo-device / expo-application, and the API base.
 *
 * `EXPO_PUBLIC_API_BASE` defaults to the local contracts mock
 * (`pnpm mock:api`). Use `127.0.0.1`, not `localhost`: the mock binds IPv4
 * only, and `localhost` may resolve to `::1` where another service can be
 * listening (Docker takes :3000 on some machines — run the mock with
 * `PORT=3100` and set EXPO_PUBLIC_API_BASE accordingly).
 * `EXPO_PUBLIC_MOCK_SCENARIO` (dev only) forwards `X-Mock-Scenario`.
 * `EXPO_PUBLIC_ENTITLEMENT_PUBKEY` is the backend's signing key; dev builds
 * fall back to the mock's key.
 *
 * A release build falls back to nothing (audit F-15d): without a usable API
 * base or public key it reports `configProblems`, and activation shows that
 * instead of calling the mock's address or running on a key that verifies
 * no plan. The same rules, stricter, fail an EAS production build before it
 * compiles (`scripts/check-release-config.mjs`).
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { resolveRuntimeConfig, type ActivationConfig } from '@xangarro/ui';
import { secureDeviceTokenStore } from './device-token-store';

function scenarioHeaders(): Record<string, string> | undefined {
  const scenario = process.env.EXPO_PUBLIC_MOCK_SCENARIO;
  return __DEV__ && scenario ? { 'X-Mock-Scenario': scenario } : undefined;
}

// Metro inlines `process.env.EXPO_PUBLIC_*` only when it is written out in full.
const runtime = resolveRuntimeConfig({
  isDev: __DEV__,
  apiBase: process.env.EXPO_PUBLIC_API_BASE,
  entitlementPublicKeyHex: process.env.EXPO_PUBLIC_ENTITLEMENT_PUBKEY,
  devApiBase: 'http://127.0.0.1:3000',
});

export const mobileActivationConfig: ActivationConfig = {
  apiBase: runtime.apiBase,
  tokenStore: secureDeviceTokenStore,
  deviceInfo: {
    name: (Device.deviceName ?? Device.modelName ?? 'Dispositivo').slice(0, 80),
    platform: Platform.OS === 'android' ? 'android' : 'ios',
    appVersion: Application.nativeApplicationVersion ?? '0.0.0',
    osVersion: String(Device.osVersion ?? Platform.Version),
  },
  extraHeaders: scenarioHeaders(),
  entitlementPublicKeyHex: runtime.entitlementPublicKeyHex,
  configProblems: runtime.problems,
};
