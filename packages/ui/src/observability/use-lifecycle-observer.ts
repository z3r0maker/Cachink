/**
 * useLifecycleObserver — logs app lifecycle events to the LogStore.
 *
 * Events logged:
 *   - `system.cold-start` — on first mount (app opened)
 *   - `system.foreground` — app came to foreground
 *   - `system.background` — app went to background
 *   - `auth.login` — userId changed from null → non-null
 *   - `auth.logout` — userId changed from non-null → null
 *
 * Mount once inside AppProviders / ObservabilityBridge, after the
 * LogStore is initialized.
 */

import { useEffect, useRef } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import { ulid } from 'ulid';
import type { AuditEvent, AuditOperation } from '@cachink/observability';
import { useLogStore } from './observability-provider';
import { useDeviceId, useUserId, useCurrentBusinessId } from '../app-config/index';

function buildEvent(
  operation: AuditOperation,
  entityType: string,
  entityId: string,
  deviceId: string,
  userId: string | null,
  businessId: string,
  metadata?: Record<string, unknown>,
): AuditEvent {
  return {
    id: ulid(),
    timestamp: new Date().toISOString(),
    operation,
    entityType,
    entityId,
    userId,
    deviceId,
    businessId,
    metadata,
    status: 'success',
  };
}

export function useLifecycleObserver(): void {
  const logStore = useLogStore();
  const deviceId = useDeviceId();
  const userId = useUserId();
  const businessId = useCurrentBusinessId();

  // 1. Log cold start (on first mount)
  const hasMounted = useRef(false);
  useEffect(() => {
    if (!logStore || !deviceId || hasMounted.current) return;
    hasMounted.current = true;

    void logStore.writeAudit(
      buildEvent(
        'system.cold-start',
        'app',
        '',
        deviceId,
        userId ?? null,
        businessId ?? '',
        { platform: Platform.OS },
      ),
    ).catch(() => {});
  }, [logStore, deviceId, userId, businessId]);

  // 2. Log foreground/background transitions
  useEffect(() => {
    if (!logStore || !deviceId) return;

    const handler = (state: AppStateStatus): void => {
      if (state === 'active') {
        void logStore.writeAudit(
          buildEvent('system.foreground', 'app', '', deviceId, userId ?? null, businessId ?? ''),
        ).catch(() => {});
      } else if (state === 'background') {
        void logStore.writeAudit(
          buildEvent('system.background', 'app', '', deviceId, userId ?? null, businessId ?? ''),
        ).catch(() => {});
      }
    };

    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [logStore, deviceId, userId, businessId]);

  // 3. Log user changes (login/logout/switch)
  const prevUserId = useRef(userId);
  useEffect(() => {
    if (!logStore || !deviceId) return;
    if (prevUserId.current === userId) return;

    const op: AuditOperation = userId ? 'auth.login' : 'auth.logout';
    void logStore.writeAudit(
      buildEvent(op, 'user', userId ?? '', deviceId, userId ?? null, businessId ?? ''),
    ).catch(() => {});

    prevUserId.current = userId;
  }, [userId, logStore, deviceId, businessId]);
}
