/**
 * Restarts the JS app: after «Desvincular y borrar» nothing the last session
 * held in memory (the ticket in progress, cached queries) may survive. A
 * release build reloads through expo-updates; a dev build through the dev
 * menu's reload, which expo-updates does not drive there.
 */

import { DevSettings } from 'react-native';

export function restartApp(): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    DevSettings.reload();
    return;
  }
  void import('expo-updates')
    .then((updates) => updates.reloadAsync())
    .catch((error: unknown) => console.error('[restartApp] reload failed', error));
}
