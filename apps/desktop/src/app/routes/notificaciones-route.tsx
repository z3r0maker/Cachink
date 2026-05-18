/**
 * Desktop route adapter for /notificaciones — Director notification inbox.
 *
 * Phase 11 — Director Notification Inbox.
 */

import type { ReactElement } from 'react';
import { NotificacionesScreen } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopRouter } from '../desktop-router-context';

export function NotificacionesRoute(): ReactElement {
  const { navigate } = useDesktopRouter();
  return (
    <DesktopAppShellWrapper activeTabKey="otros">
      <NotificacionesScreen
        onNavigate={navigate}
        testID="desktop-notificaciones"
      />
    </DesktopAppShellWrapper>
  );
}
