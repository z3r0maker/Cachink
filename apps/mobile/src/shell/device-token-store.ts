/**
 * DeviceTokenStore backed by the OS keychain / keystore (A-04).
 * The device token is a bearer credential, so it never goes in SQLite.
 *
 * On iOS the item is «after first unlock, this device only» (audit F-15e).
 * «This device only» is the property the finding asked for: the item is
 * left out of backups and of a transfer to another phone. «After first
 * unlock» rather than «when unlocked», because the screen can lock with the
 * app in front and a sync in flight, and a when-unlocked item stops being
 * readable seconds later; this one stays readable until the next reboot.
 * Android ignores the option (its values are encrypted with a Keystore key
 * that never leaves the device, and the app opts out of backups).
 *
 * expo-secure-store cannot change an existing item's accessibility: writing
 * over one updates its value and nothing else (`SecItemAdd` answers
 * `errSecDuplicateItem`, then `SecItemUpdate` with the value alone). So the
 * token lives under a new key, and a phone linked before this change has
 * its token moved there on first read: the new item is written first and
 * the old one removed after, so the phone is never without its token.
 */

import * as SecureStore from 'expo-secure-store';
import type { DeviceTokenStore } from '@xangarro/ui';

const KEY = 'xangarro.deviceToken.v2';
/** Where the token was kept before F-15e, at the default accessibility. */
const LEGACY_KEY = 'xangarro.deviceToken';

const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

/** The old item's token, moved to the new one when the keychain allows it. */
async function readLegacy(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(LEGACY_KEY);
  if (token === null) return null;
  try {
    await SecureStore.setItemAsync(KEY, token, OPTIONS);
    await SecureStore.deleteItemAsync(LEGACY_KEY);
  } catch {
    // The token is still where it was; the next read tries the move again.
  }
  return token;
}

export const secureDeviceTokenStore: DeviceTokenStore = {
  get: async () => (await SecureStore.getItemAsync(KEY)) ?? (await readLegacy()),
  set: async (token) => {
    await SecureStore.setItemAsync(KEY, token, OPTIONS);
    await SecureStore.deleteItemAsync(LEGACY_KEY);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(KEY);
    await SecureStore.deleteItemAsync(LEGACY_KEY);
  },
};
