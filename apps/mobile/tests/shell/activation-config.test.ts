import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The memo is identity here: the hook's mapping is what is pinned.

/**
 * The shell's platform plumbing (A-04), all Expo surfaces mocked: the
 * ActivationConfig assembles from the environment (the mock's base URL by
 * default, the scenario header only in dev, the entitlement key or the dev
 * fallback), the token store is the keychain's (`device-token-store.test.ts`),
 * and the device context reports what the OS says — with 'unknown' when the
 * version is missing.
 */

// The keychain itself is `device-token-store.test.ts`'s subject.
vi.mock('expo-secure-store', () => ({
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  getItemAsync: vi.fn(async () => null),
  setItemAsync: vi.fn(async () => undefined),
  deleteItemAsync: vi.fn(async () => undefined),
}));
vi.mock('expo-application', () => ({
  nativeApplicationVersion: '3.1.4',
  nativeBuildVersion: '42',
}));
vi.mock('expo-device', () => ({
  deviceName: 'Pixel de Pedro',
  modelName: 'Pixel 8',
  osVersion: '15',
}));
vi.mock('react-native', () => ({ Platform: { OS: 'android', Version: 15 } }));
// The shell reads two things from the UI package, both in one import-free
// file: the real rules run here, the rest of the package stays out.
vi.mock(
  '@xangarro/ui',
  async () => await import('../../../../packages/ui/src/activation/release-config'),
);
vi.mock('@xangarro/observability', () => ({}));
vi.mock('react', () => ({ useMemo: <T>(f: () => T) => f() }));

/** Metro injects __DEV__; the runner must too. */
declare global {
  var __DEV__: boolean;
}
(globalThis as { __DEV__?: boolean }).__DEV__ = true;

const { secureDeviceTokenStore } = await import('../../src/shell/device-token-store');
const { mobileActivationConfig } = await import('../../src/shell/activation-config');
const { useMobileDeviceContext } = await import('../../src/shell/use-device-context');

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.EXPO_PUBLIC_API_BASE;
  delete process.env.EXPO_PUBLIC_MOCK_SCENARIO;
  delete process.env.EXPO_PUBLIC_ENTITLEMENT_PUBKEY;
});

afterEach(() => {
  delete process.env.EXPO_PUBLIC_API_BASE;
  delete process.env.EXPO_PUBLIC_MOCK_SCENARIO;
  delete process.env.EXPO_PUBLIC_ENTITLEMENT_PUBKEY;
});

describe('mobileActivationConfig', () => {
  it('defaults to the contracts mock on IPv4, not localhost', () => {
    expect(mobileActivationConfig.apiBase).toBe('http://127.0.0.1:3000');
  });

  it('assembles the device facts, the secure store and the dev key fallback, frozen at boot', () => {
    // Metro replaces EXPO_PUBLIC_* at bundle time; the runner sees plain
    // env, so the module boots with the defaults and its shape is the test.
    expect(mobileActivationConfig.tokenStore).toBe(secureDeviceTokenStore);
    expect(mobileActivationConfig.deviceInfo.platform).toBe('android');
    expect(mobileActivationConfig.deviceInfo.appVersion).toBe('3.1.4');
    expect(mobileActivationConfig.deviceInfo.osVersion).toBe('15');
    expect(mobileActivationConfig.deviceInfo.name).toContain('Pixel');
    expect(mobileActivationConfig.entitlementPublicKeyHex.length).toBeGreaterThan(0);
    // In dev (__DEV__ pinned true for the runner), the scenario header
    // exists only when the env names one; it does not here.
    expect(mobileActivationConfig.extraHeaders).toBeUndefined();
  });
});

/** The shell as a bundle built with `env` boots it; `dev` is Metro's `__DEV__`. */
async function boot(dev: boolean, env: Readonly<Record<string, string>>) {
  vi.resetModules();
  (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
  Object.assign(process.env, env);
  try {
    return (await import('../../src/shell/activation-config')).mobileActivationConfig;
  } finally {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
  }
}

describe('mobileActivationConfig in a release bundle (audit F-15d)', () => {
  const KEY = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';

  it('never falls back to the mock or to a key that verifies nothing in silence', async () => {
    const config = await boot(false, {});
    expect(config.apiBase).toBe('');
    expect(config.entitlementPublicKeyHex).toBe('');
    expect(config.configProblems?.map((p) => p.code)).toEqual([
      'API_BASE_MISSING',
      'PUBKEY_MALFORMED',
    ]);
  });

  it('reports a value EAS handed over unfilled', async () => {
    const config = await boot(false, {
      EXPO_PUBLIC_API_BASE: '$PRODUCTION_API_BASE',
      EXPO_PUBLIC_ENTITLEMENT_PUBKEY: '$PRODUCTION_ENTITLEMENT_PUBKEY',
    });
    expect(config.apiBase).toBe('');
    expect(config.configProblems?.map((p) => p.code)).toEqual([
      'API_BASE_INVALID',
      'PUBKEY_MALFORMED',
    ]);
  });

  it('runs with a complete configuration and reports nothing', async () => {
    const config = await boot(false, {
      EXPO_PUBLIC_API_BASE: 'https://app.xangarro.mx',
      EXPO_PUBLIC_ENTITLEMENT_PUBKEY: KEY,
    });
    expect(config.apiBase).toBe('https://app.xangarro.mx');
    expect(config.entitlementPublicKeyHex).toBe(KEY);
    expect(config.configProblems).toEqual([]);
  });

  it('in development keeps the mock default and reports nothing', async () => {
    const config = await boot(true, {});
    expect(config.apiBase).toBe('http://127.0.0.1:3000');
    expect(config.entitlementPublicKeyHex).toHaveLength(64);
    expect(config.configProblems).toEqual([]);
  });
});

describe('useMobileDeviceContext', () => {
  it('reports the OS facts and normalises the platform', () => {
    const ctx = useMobileDeviceContext();
    expect(ctx).toEqual({
      model: 'Pixel 8',
      osName: 'Android',
      osVersion: '15',
      appVersion: '3.1.4',
      buildNumber: '42',
      platform: 'android',
    });
  });
});
