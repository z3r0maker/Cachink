/**
 * Sentry breadcrumb integration for React Native (ADR-025 platform split).
 *
 * Same API as sentry-breadcrumbs.ts but uses @sentry/react-native.
 */

import type { AuditEvent } from '@cachink/observability';

/**
 * Add a Sentry breadcrumb for a completed audit event.
 * Uses dynamic import to avoid bundling Sentry when consent is off.
 */
export function addAuditBreadcrumb(event: AuditEvent): void {
  try {
    const sentry = (globalThis as Record<string, unknown>).__SENTRY__;
    if (!sentry) return;

    void import('@sentry/react-native').then((Sentry) => {
      Sentry.addBreadcrumb({
        category: 'business',
        message: `${event.operation} → ${event.entityId.slice(0, 8)}`,
        level: event.status === 'error' ? 'error' : 'info',
        data: {
          entityType: event.entityType,
          status: event.status,
          ...(event.errorCode ? { errorCode: event.errorCode } : {}),
        },
      });
    }).catch(() => {});
  } catch {
    // Never crash for breadcrumbs
  }
}
