/**
 * useDesktopDeviceContext — provides device context for outbox enrichment.
 *
 * Derives values from navigator.userAgent and a build-time version constant.
 * Desktop has no expo-device, so we parse the UA string.
 */

import { useMemo } from 'react';
import type { DeviceContext } from '@cachink/observability';

/** Build-time version — updated by release pipeline. */
function readAppVersion(): string {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_APP_VERSION ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function platformKey(): DeviceContext['platform'] {
  if (typeof navigator !== 'undefined' && /Win/i.test(navigator.platform)) {
    return 'desktop-windows';
  }
  return 'desktop-mac';
}

function parseOsVersion(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  // macOS
  const macMatch = /Mac OS X ([\d._]+)/.exec(ua);
  if (macMatch?.[1]) return macMatch[1].replace(/_/g, '.');
  // Windows
  const winMatch = /Windows NT ([\d.]+)/.exec(ua);
  if (winMatch?.[1]) return winMatch[1];
  return 'unknown';
}

function parseOsName(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  if (/Mac/i.test(navigator.platform)) return 'macOS';
  if (/Win/i.test(navigator.platform)) return 'Windows';
  return 'unknown';
}

export function useDesktopDeviceContext(): DeviceContext {
  return useMemo<DeviceContext>(() => ({
    model: null,
    osName: parseOsName(),
    osVersion: parseOsVersion(),
    appVersion: readAppVersion(),
    buildNumber: null,
    platform: platformKey(),
  }), []);
}
