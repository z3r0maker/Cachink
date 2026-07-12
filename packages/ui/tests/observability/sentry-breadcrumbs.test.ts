/**
 * sentry-breadcrumbs tests — addAuditBreadcrumb utility.
 *
 * Covers no-Sentry guard and never-crash guarantee.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { AuditEvent } from '@cachink/observability';
import { addAuditBreadcrumb } from '../../src/observability/sentry-breadcrumbs';

const EVENT: AuditEvent = {
  id: '01ABC',
  timestamp: '2026-06-15T12:00:00.000Z',
  operation: 'crear-venta',
  entityType: 'sale',
  entityId: '01DEF12345678901234567',
  userId: null,
  deviceId: 'DEV001',
  businessId: 'BIZ001',
  status: 'success',
};

describe('addAuditBreadcrumb', () => {
  afterEach(() => {
    // Clean up global
    delete (globalThis as any).__SENTRY__;
  });

  it('does nothing when __SENTRY__ is not set', () => {
    // Should not throw
    addAuditBreadcrumb(EVENT);
  });

  it('does not crash with error events', () => {
    addAuditBreadcrumb({ ...EVENT, status: 'error', errorCode: 'TEST_ERR' });
  });

  it('does not crash when __SENTRY__ is a non-object', () => {
    (globalThis as any).__SENTRY__ = 'bad';
    // Dynamic import will fail but should be caught
    addAuditBreadcrumb(EVENT);
  });
});
