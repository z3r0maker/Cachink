/**
 * DeviceTokenStore backed by the OS keychain / keystore (A-04).
 * The device token is a bearer credential, so it never goes in SQLite.
 */

import * as SecureStore from 'expo-secure-store';
import type { DeviceTokenStore } from '@xangarro/ui';

const KEY = 'xangarro.deviceToken';

export const secureDeviceTokenStore: DeviceTokenStore = {
  get: () => SecureStore.getItemAsync(KEY),
  set: (token) => SecureStore.setItemAsync(KEY, token),
  clear: () => SecureStore.deleteItemAsync(KEY),
};
