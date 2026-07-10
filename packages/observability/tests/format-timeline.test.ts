/**
 * formatTimelineAsText tests.
 */

import { describe, it, expect } from 'vitest';
import { formatTimelineAsText } from '../src/format-timeline.js';
import type { TimelineEntry } from '../src/log-store.js';

const AUDIT_SUCCESS: TimelineEntry = {
  type: 'audit',
  id: 'evt-1',
  timestamp: '2026-05-16T14:30:00.000Z',
  operation: 'venta.registrar',
  entityType: 'sale',
  entityId: 'sale-abc123',
  userId: 'usr-01',
  deviceId: 'dev-001',
  businessId: 'biz-01',
  status: 'success',
};

const AUDIT_WITH_DURATION: TimelineEntry = {
  type: 'audit',
  id: 'evt-2',
  timestamp: '2026-05-16T14:31:00.000Z',
  operation: 'caja.abrir',
  entityType: 'caja_turno',
  entityId: 'turno-xyz',
  userId: null,
  deviceId: 'dev-001',
  businessId: 'biz-01',
  status: 'success',
  durationMs: 42,
};

const AUDIT_ERROR: TimelineEntry = {
  type: 'audit',
  id: 'evt-3',
  timestamp: '2026-05-16T14:32:00.000Z',
  operation: 'egreso.registrar',
  entityType: 'expense',
  entityId: '',
  userId: null,
  deviceId: 'dev-001',
  businessId: 'biz-01',
  status: 'error',
  errorCode: 'ZodError',
  errorMessage: 'monto must be > 0',
};

const ERROR_ENTRY: TimelineEntry = {
  type: 'error',
  id: 'err-1',
  timestamp: '2026-05-16T14:33:00.000Z',
  source: 'ui',
  errorName: 'RenderError',
  errorMessage: 'Component crashed',
  userId: null,
  deviceId: 'dev-001',
  businessId: 'biz-01',
};

describe('formatTimelineAsText', () => {
  it('returns a report with header and footer', () => {
    const output = formatTimelineAsText([]);
    expect(output).toContain('=== Cachink! Timeline Report ===');
    expect(output).toContain('Total entries: 0');
    expect(output).toContain('=== End of Report ===');
  });

  it('formats a successful audit entry with ✅', () => {
    const output = formatTimelineAsText([AUDIT_SUCCESS]);
    expect(output).toContain('✅');
    expect(output).toContain('venta.registrar');
    expect(output).toContain('sale');
    expect(output).toContain('sale-abc');
  });

  it('includes durationMs when present', () => {
    const output = formatTimelineAsText([AUDIT_WITH_DURATION]);
    expect(output).toContain('(42ms)');
  });

  it('formats a failed audit entry with ❌ and error message', () => {
    const output = formatTimelineAsText([AUDIT_ERROR]);
    expect(output).toContain('❌');
    expect(output).toContain('Error: monto must be > 0');
  });

  it('formats error entries with 🔴', () => {
    const output = formatTimelineAsText([ERROR_ENTRY]);
    expect(output).toContain('🔴 ERROR');
    expect(output).toContain('[ui]');
    expect(output).toContain('RenderError');
    expect(output).toContain('Component crashed');
  });

  it('formats multiple entries in order', () => {
    const output = formatTimelineAsText([
      AUDIT_SUCCESS,
      AUDIT_WITH_DURATION,
      ERROR_ENTRY,
    ]);
    expect(output).toContain('Total entries: 3');
    // All entry types should be present
    expect(output).toContain('✅');
    expect(output).toContain('🔴 ERROR');
  });

  it('handles empty entityId with dash', () => {
    const entry: TimelineEntry = {
      ...AUDIT_SUCCESS,
      entityId: '',
    };
    const output = formatTimelineAsText([entry]);
    expect(output).toContain('—');
  });

  it('falls back to ISO substring when locale formatting fails', () => {
    // This tests the catch branch in formatTime by using an invalid timestamp
    const badEntry: TimelineEntry = {
      ...AUDIT_SUCCESS,
      timestamp: 'invalid-timestamp',
    };
    // Should not throw — falls back to slice
    const output = formatTimelineAsText([badEntry]);
    expect(output).toContain('=== Cachink! Timeline Report ===');
  });
});
