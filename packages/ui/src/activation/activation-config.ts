/**
 * Activation wiring injected by the app shell (A-04).
 *
 * The device token is a credential, so it lives in platform secure storage
 * (expo-secure-store on mobile); everything else about activation is plain
 * app_config. Tests and web use the in-memory store.
 */

export interface DeviceTokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

export interface DeviceInfo {
  readonly name: string;
  readonly platform: 'ios' | 'android';
  readonly appVersion: string;
  readonly osVersion: string;
}

export interface ActivationConfig {
  /** e.g. `http://localhost:3000` (mock) or `https://app.xangarro.mx`. */
  readonly apiBase: string;
  readonly tokenStore: DeviceTokenStore;
  readonly deviceInfo: DeviceInfo;
  /** Dev-only extra headers, e.g. `X-Mock-Scenario`. */
  readonly extraHeaders?: Readonly<Record<string, string>>;
  /**
   * Hex Ed25519 public key that signs entitlements (A-10). An empty or wrong
   * key means nothing verifies → Freelancer limits, never a lock.
   */
  readonly entitlementPublicKeyHex: string;
}

/** DEV ONLY — the contracts mock's signing key (`packages/contracts/src/mock/dev-keys.json`). */
export const DEV_ENTITLEMENT_PUBLIC_KEY_HEX =
  'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

/** Persisted in app_config under `activation`. */
export interface ActivationRecord {
  readonly deviceId: string;
  readonly businessId: string;
  readonly activatedAt: string;
}

export function memoryTokenStore(initial: string | null = null): DeviceTokenStore {
  let token = initial;
  return {
    get: async () => token,
    set: async (t) => {
      token = t;
    },
    clear: async () => {
      token = null;
    },
  };
}

export const DEFAULT_ACTIVATION_CONFIG: ActivationConfig = {
  apiBase: 'http://localhost:3000',
  tokenStore: memoryTokenStore(),
  deviceInfo: { name: 'Dispositivo', platform: 'ios', appVersion: '0.0.0', osVersion: '0' },
  entitlementPublicKeyHex: DEV_ENTITLEMENT_PUBLIC_KEY_HEX,
};

export function parseActivationRecord(raw: string | null): ActivationRecord | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ActivationRecord>;
    if (
      typeof v.deviceId === 'string' &&
      typeof v.businessId === 'string' &&
      typeof v.activatedAt === 'string'
    ) {
      return { deviceId: v.deviceId, businessId: v.businessId, activatedAt: v.activatedAt };
    }
    return null;
  } catch {
    return null;
  }
}
