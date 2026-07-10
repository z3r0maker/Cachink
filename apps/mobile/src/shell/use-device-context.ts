/**
 * useMobileDeviceContext — provides device context for outbox enrichment.
 *
 * Uses expo-device + expo-application to get real device info instead
 * of hardcoded values.
 */

import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import type { DeviceContext } from '@cachink/observability';

function platformKey(): DeviceContext['platform'] {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

export function useMobileDeviceContext(): DeviceContext {
  return useMemo<DeviceContext>(() => ({
    model: Device.modelName,
    osName: Platform.OS === 'ios' ? 'iOS' : 'Android',
    osVersion: Platform.Version?.toString() ?? 'unknown',
    appVersion: Application.nativeApplicationVersion ?? '0.0.0',
    buildNumber: Application.nativeBuildVersion,
    platform: platformKey(),
  }), []);
}
