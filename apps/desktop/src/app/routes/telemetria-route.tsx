/**
 * Desktop route adapter for /telemetria — dev-only observability dashboard.
 */

import type { ReactElement } from 'react';
import { TelemetriaScreen } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

export function TelemetriaRoute(): ReactElement {
  const navigate = useDesktopNavigate();

  // Hard-gate: redirect in production
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    navigate('/');
    return <></> as unknown as ReactElement;
  }

  return (
    <DesktopAppShellWrapper activeTabKey="otros" onBack={() => navigate('/otros')}>
      <TelemetriaScreen />
    </DesktopAppShellWrapper>
  );
}
