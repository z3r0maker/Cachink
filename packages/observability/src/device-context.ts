/**
 * DeviceContext — device & app metadata attached to outbox payloads.
 *
 * Injected via bridges: mobile supplies expo-device/expo-application
 * values; desktop supplies navigator.userAgent-derived values.
 */

export interface DeviceContext {
  readonly model: string | null;
  readonly osName: string;
  readonly osVersion: string;
  readonly appVersion: string;
  readonly buildNumber: string | null;
  readonly platform: 'ios' | 'android' | 'desktop-mac' | 'desktop-windows';
}
