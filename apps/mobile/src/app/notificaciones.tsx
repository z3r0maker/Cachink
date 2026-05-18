/**
 * Expo Router entry for /notificaciones — Director notification inbox.
 *
 * Phase 11 — Director Notification Inbox.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { NotificacionesScreen } from '@cachink/ui';
import { AppShellWrapper } from '../shell/app-shell-wrapper';

export default function NotificacionesRoute(): ReactElement {
  const router = useRouter();

  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <NotificacionesScreen
        onNavigate={(path) => router.push(path as never)}
        testID="mobile-notificaciones"
      />
    </AppShellWrapper>
  );
}
