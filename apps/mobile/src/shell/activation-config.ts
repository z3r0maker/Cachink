/**
 * Mobile ActivationConfig (A-04): secure token store, device info from
 * expo-device / expo-application, and the API base.
 *
 * `EXPO_PUBLIC_API_BASE` defaults to the local contracts mock
 * (`pnpm mock:api`), reachable from the iOS simulator as localhost.
 * `EXPO_PUBLIC_MOCK_SCENARIO` (dev only) forwards `X-Mock-Scenario`.
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import type { ActivationConfig } from '@xangarro/ui';
import { secureDeviceTokenStore } from './device-token-store';

function scenarioHeaders(): Record<string, string> | undefined {
  const scenario = process.env.EXPO_PUBLIC_MOCK_SCENARIO;
  return __DEV__ && scenario ? { 'X-Mock-Scenario': scenario } : undefined;
}

export const mobileActivationConfig: ActivationConfig = {
  apiBase: process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:3000',
  tokenStore: secureDeviceTokenStore,
  deviceInfo: {
    name: (Device.deviceName ?? Device.modelName ?? 'Dispositivo').slice(0, 80),
    platform: Platform.OS === 'android' ? 'android' : 'ios',
    appVersion: Application.nativeApplicationVersion ?? '0.0.0',
    osVersion: String(Device.osVersion ?? Platform.Version),
  },
  extraHeaders: scenarioHeaders(),
};
