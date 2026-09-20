/**
 * NotificationTapHost — mobile-only notification response listener.
 *
 * Responsibilities:
 *   1. `setNotificationHandler` — shows banner + sound even when the
 *      app is in the foreground.
 *   2. `addNotificationResponseReceivedListener` — handles taps on OS
 *      notifications (both warm-start and cold-start via
 *      `getLastNotificationResponseAsync`).
 *   3. If the app is locked (userId === null), queues the `actionRoute`
 *      until the user passes the QuickSwitchGate PIN flow, then
 *      navigates.
 *   4. Marks the alert as read when navigating.
 *
 * Mounted once at the mobile shell root (inside `<AppProviders>` so
 * hooks resolve). App-shell only per CLAUDE.md §5.6.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useUserId, useMarkAlertRead } from '@xangarro/ui';
import type { DirectorAlertId } from '@xangarro/domain';

// ── Foreground handler ─────────────────────────────────────────────
// Show banner + badge + sound even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ── Payload shape coming from presentNow() ─────────────────────────
interface NotificationPayload {
  readonly actionRoute?: string;
  readonly alertId?: string;
}

function extractPayload(response: Notifications.NotificationResponse): NotificationPayload {
  return (response.notification.request.content.data ?? {}) as NotificationPayload;
}

// ── Component ──────────────────────────────────────────────────────
interface TapHandler {
  readonly handleTap: (payload: NotificationPayload) => void;
  readonly pendingRoute: string | null;
  readonly pendingAlertId: string | null;
  readonly clearPending: () => void;
}

/** Navigate immediately when unlocked; otherwise queue the route until unlock. */
function useNotificationTapHandler(userId: string | null): TapHandler {
  const router = useRouter();
  const markRead = useMarkAlertRead();
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null);
  const handleTap = (payload: NotificationPayload): void => {
    const route = payload.actionRoute ?? '/productos';
    const alertId = payload.alertId ?? null;
    if (userId !== null) {
      if (alertId) markRead.mutate(alertId as DirectorAlertId);
      router.push(route as never);
      return;
    }
    setPendingRoute(route);
    setPendingAlertId(alertId);
  };
  const clearPending = (): void => {
    if (pendingAlertId) markRead.mutate(pendingAlertId as DirectorAlertId);
    if (pendingRoute) router.push(pendingRoute as never);
    setPendingRoute(null);
    setPendingAlertId(null);
  };
  return { handleTap, pendingRoute, pendingAlertId, clearPending };
}

export function NotificationTapHost(): ReactElement | null {
  const userId = useUserId();
  const { handleTap, pendingRoute, clearPending } = useNotificationTapHandler(userId);
  const coldStartHandled = useRef(false);

  // ── Warm-start tap listener ────────────────────────────────────
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      handleTap(extractPayload(response)),
    );
    return () => subscription.remove();
  }, [userId]);

  // ── Cold-start tap (app was killed) ────────────────────────────
  useEffect(() => {
    if (coldStartHandled.current) return;
    coldStartHandled.current = true;
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleTap(extractPayload(response));
    });
  }, []);

  // ── Flush pending route once user unlocks ──────────────────────
  useEffect(() => {
    if (userId !== null && pendingRoute !== null) clearPending();
  }, [userId, pendingRoute]);

  // Renderless — all logic lives in effects.
  return null;
}
