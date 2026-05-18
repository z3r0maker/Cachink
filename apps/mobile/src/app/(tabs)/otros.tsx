/**
 * Expo Router entry for /otros — feature-flagged grid shortcuts.
 *
 * The persistent `(tabs)/_layout.tsx` provides the AppShell; this file
 * renders ONLY the OtrosScreen content area. Items are filtered by
 * the active feature flags and the user's role.
 */

import type { ReactElement } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  OtrosScreen,
  useFeatureFlags,
  useRole,
  ResetDemoAction,
} from '@cachink/ui';
import { nativeResetDatabase } from '@cachink/ui/database/reset-native';

function reloadApp(): void {
  // In dev, DevSettings.reload() restarts the JS bundle
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DevSettings } = require('react-native');
  DevSettings.reload();
}

export default function OtrosRoute(): ReactElement {
  const router = useRouter();
  const role = useRole();
  const flags = useFeatureFlags();

  return (
    <View style={{ flex: 1 }}>
      <OtrosScreen
        role={role === 'director' ? 'director' : 'operativo'}
        flags={flags}
        onNavigate={(path) => router.push(path as never)}
        testID="otros-route"
      />
      {typeof __DEV__ !== 'undefined' && __DEV__ && (
        <View style={{ padding: 16 }}>
          <ResetDemoAction
            resetDatabase={nativeResetDatabase}
            onReload={reloadApp}
          />
        </View>
      )}
    </View>
  );
}
