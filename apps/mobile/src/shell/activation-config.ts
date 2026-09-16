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
 * fall back to the mock's key, release builds without it verify nothing
 * (Freelancer limits) rather than trusting an unsigned plan.
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { DEV_ENTITLEMENT_PUBLIC_KEY_HEX, type ActivationConfig } from '@xangarro/ui';
import { secureDeviceTokenStore } from './device-token-store';

function scenarioHeaders(): Record<string, string> | undefined {
  const scenario = process.env.EXPO_PUBLIC_MOCK_SCENARIO;
  return __DEV__ && scenario ? { 'X-Mock-Scenario': scenario } : undefined;
}

export const mobileActivationConfig: ActivationConfig = {
  apiBase: process.env.EXPO_PUBLIC_API_BASE ?? 'http://127.0.0.1:3000',
  tokenStore: secureDeviceTokenStore,
  deviceInfo: {
    name: (Device.deviceName ?? Device.modelName ?? 'Dispositivo').slice(0, 80),
    platform: Platform.OS === 'android' ? 'android' : 'ios',
    appVersion: Application.nativeApplicationVersion ?? '0.0.0',
    osVersion: String(Device.osVersion ?? Platform.Version),
  },
  extraHeaders: scenarioHeaders(),
  entitlementPublicKeyHex:
    process.env.EXPO_PUBLIC_ENTITLEMENT_PUBKEY ?? (__DEV__ ? DEV_ENTITLEMENT_PUBLIC_KEY_HEX : ''),
};
