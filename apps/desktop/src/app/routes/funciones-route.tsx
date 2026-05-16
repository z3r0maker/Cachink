/**
 * Desktop route adapter for /funciones — Director-only feature flags.
 *
 * Mirrors `apps/mobile/src/app/funciones.tsx`.
 */

import type { ReactElement } from 'react';
import {
  FuncionesNegocioScreen,
  useFeatureFlags,
  useToggleFeatureFlag,
} from '@cachink/ui';
import type { FeatureFlagKey, FeatureFlags } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

export function FuncionesRoute(): ReactElement {
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
    <DesktopAppShellWrapper activeTabKey="otros">
      <FuncionesNegocioScreen
        flags={flags}
        onToggle={handleToggle}
        testID="funciones-desktop-route"
      />
    </DesktopAppShellWrapper>
  );
}
