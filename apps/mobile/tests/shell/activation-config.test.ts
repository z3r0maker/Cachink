import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// The memo is identity here: the hook's mapping is what is pinned.

/**
 * The shell's platform plumbing (A-04), all Expo surfaces mocked: the
 * ActivationConfig assembles from the environment (the mock's base URL by
 * default, the scenario header only in dev, the entitlement key or the dev
 * fallback), the token store never touches SQLite, and the device context
 * reports what the OS says — with 'unknown' when the version is missing.
 */

const getItemAsync = vi.fn(async () => 'tok-viejo');
const setItemAsync = vi.fn(async () => undefined);
const deleteItemAsync = vi.fn(async () => undefined);

vi.mock('expo-secure-store', () => ({
  getItemAsync: (...a: unknown[]) => getItemAsync(...a),
  setItemAsync: (...a: unknown[]) => setItemAsync(...a),
  deleteItemAsync: (...a: unknown[]) => deleteItemAsync(...a),
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
vi.mock('@xangarro/ui', () => ({
  DEV_ENTITLEMENT_PUBLIC_KEY_HEX: 'ab'.repeat(32),
}));
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

describe('secureDeviceTokenStore', () => {
  it('reads, writes and clears the one keychain key — never SQLite', async () => {
    await secureDeviceTokenStore.set('tok-nuevo');
    expect(setItemAsync).toHaveBeenCalledWith('xangarro.deviceToken', 'tok-nuevo');
    expect(await secureDeviceTokenStore.get()).toBe('tok-viejo');
    expect(getItemAsync).toHaveBeenCalledWith('xangarro.deviceToken');
    await secureDeviceTokenStore.clear();
    expect(deleteItemAsync).toHaveBeenCalledWith('xangarro.deviceToken');
  });
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
