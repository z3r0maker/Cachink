/**
 * useNavigationObserver — logs screen transitions to the LogStore.
 *
 * Mount in AppShell or route layout. Listens to pathname changes and
 * writes `nav.screen-view` audit events.
 *
 * Logs in both dev and production. In production, breadcrumbs are
 * stored locally and only shipped remotely when consent is enabled
 * (via the outbox flusher).
 */

import { useEffect, useRef } from 'react';
import { ulid } from 'ulid';
import type { AuditEvent } from '@cachink/observability';
import { useLogStore } from './observability-provider';
import { useDeviceId, useUserId, useCurrentBusinessId } from '../app-config/index';

/**
 * Log screen transitions. Requires a `pathname` from the routing layer
 * (expo-router's `usePathname()` or wouter's `useLocation()`).
 *
 * @param pathname - current route path string
 */
export function useNavigationObserver(pathname?: string): void {
  const logStore = useLogStore();
  const deviceId = useDeviceId();
  const userId = useUserId();
  const businessId = useCurrentBusinessId();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (!logStore || !deviceId || !pathname) return;
    if (pathname === prevPath.current) return;

    const event: AuditEvent = {
      id: ulid(),
      timestamp: new Date().toISOString(),
      operation: 'nav.screen-view',
      entityType: 'screen',
      entityId: pathname,
      userId: userId ?? null,
      deviceId,
      businessId: businessId ?? '',
      metadata: { from: prevPath.current ?? '' },
      status: 'success',
    };

    void logStore.writeAudit(event).catch(() => {});
    prevPath.current = pathname;
  }, [pathname, logStore, deviceId, userId, businessId]);
}
