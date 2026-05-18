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
  ResetDemoAction,
} from '@cachink/ui';
import { webResetDatabase } from '@cachink/ui/database/reset-web';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

function reloadApp(): void {
  window.location.reload();
}

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
      {typeof __DEV__ !== 'undefined' && __DEV__ && (
        <div style={{ padding: 16 }}>
          <ResetDemoAction
            resetDatabase={webResetDatabase}
            onReload={reloadApp}
          />
        </div>
      )}
    </DesktopAppShellWrapper>
  );
}
