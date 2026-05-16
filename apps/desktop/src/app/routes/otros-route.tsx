/**
 * Desktop route adapter for /otros — feature-flagged shortcuts grid.
 *
 * Mirrors `apps/mobile/src/app/(tabs)/otros.tsx`.
 */

import type { ReactElement } from 'react';
import {
  OtrosScreen,
  useFeatureFlags,
  useRole,
} from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

export function OtrosRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const role = useRole();
  const flags = useFeatureFlags();

  return (
    <DesktopAppShellWrapper activeTabKey="otros">
      <OtrosScreen
        role={role === 'director' ? 'director' : 'operativo'}
        flags={flags}
        onNavigate={navigate}
        testID="otros-desktop-route"
      />
    </DesktopAppShellWrapper>
  );
}
