/**
 * Expo Router entry for /otros — feature-flagged grid shortcuts.
 *
 * The persistent `(tabs)/_layout.tsx` provides the AppShell; this file
 * renders ONLY the OtrosScreen content area. Items are filtered by
 * the active feature flags and the user's role.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  OtrosScreen,
  useFeatureFlags,
  useRole,
} from '@cachink/ui';

export default function OtrosRoute(): ReactElement {
  const router = useRouter();
  const role = useRole();
  const flags = useFeatureFlags();

  return (
    <OtrosScreen
      role={role === 'director' ? 'director' : 'operativo'}
      flags={flags}
      onNavigate={(path) => router.push(path as never)}
      testID="otros-route"
    />
  );
}
