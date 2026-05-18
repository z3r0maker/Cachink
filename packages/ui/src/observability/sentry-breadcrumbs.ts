/**
 * Sentry breadcrumb integration for observability events.
 *
 * Adds a business-level breadcrumb on every audit event so that if a
 * crash occurs later, Sentry's breadcrumb trail shows the money-movement
 * context leading up to the crash.
 */

import type { AuditEvent } from '@cachink/observability';

/**
 * Add a Sentry breadcrumb for a completed audit event.
 * Uses dynamic import to avoid bundling Sentry when consent is off.
 */
export function addAuditBreadcrumb(event: AuditEvent): void {
  try {
    // Sentry may not be loaded; safe to call the global if available
    const sentry = (globalThis as Record<string, unknown>).__SENTRY__;
    if (!sentry) return;

    // Use the lightweight addBreadcrumb from @sentry/browser
    void import('@sentry/browser').then((Sentry) => {
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
