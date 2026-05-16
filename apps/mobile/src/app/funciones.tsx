/**
 * Expo Router entry for /funciones — Director-only feature flag management.
 *
 * Wraps `FuncionesNegocioScreen` and wires the `useToggleFeatureFlag`
 * mutation so each toggle persists the flag change to the database and
 * invalidates `currentBusiness`, which re-reads flags for the tab layout.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  FuncionesNegocioScreen,
  useFeatureFlags,
  useToggleFeatureFlag,
} from '@cachink/ui';
import type { FeatureFlagKey, FeatureFlags } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function FuncionesRoute(): ReactElement {
  const router = useRouter();
  const flags = useFeatureFlags();
  const toggle = useToggleFeatureFlag();

  function handleToggle(
    _key: FeatureFlagKey,
    newFlags: FeatureFlags,
  ): void {
    const allKeys = Object.keys(newFlags) as FeatureFlagKey[];
    for (const k of allKeys) {
      if (newFlags[k] !== flags[k]) {
        toggle.mutate({ key: k, newValue: newFlags[k] });
      }
    }
  }

  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <FuncionesNegocioScreen
        flags={flags}
        onToggle={handleToggle}
        testID="funciones-route"
      />
    </AppShellWrapper>
  );
}
