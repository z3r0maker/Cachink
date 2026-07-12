/**
 * Row mapper tests — rowToAuditEvent, rowToErrorEntry, rowToTimelineEntry.
 */

import { describe, it, expect } from 'vitest';
import {
  rowToAuditEvent,
  rowToErrorEntry,
  rowToTimelineEntry,
  type RawRow,
} from '../src/row-mappers.js';

function makeRawAuditRow(overrides: Partial<RawRow> = {}): RawRow {
  return {
    id: 'row-1',
    type: 'audit',
    timestamp: '2026-05-16T14:00:00.000Z',
    operation: 'venta.registrar',
    entity_type: 'sale',
    entity_id: 'sale-abc',
    user_id: 'usr-01',
    device_id: 'dev-001',
    business_id: 'biz-01',
    status: 'success',
    error_name: null,
    error_message: null,
    error_stack: null,
    source: null,
    metadata: null,
    context: null,
    duration_ms: null,
    ...overrides,
  };
}

function makeRawErrorRow(overrides: Partial<RawRow> = {}): RawRow {
  return {
    id: 'err-1',
    type: 'error',
    timestamp: '2026-05-16T14:05:00.000Z',
    operation: 'egreso.registrar',
    entity_type: null,
    entity_id: null,
    user_id: 'usr-01',
    device_id: 'dev-001',
    business_id: 'biz-01',
    status: null,
    error_name: 'ZodError',
    error_message: 'monto must be > 0',
    error_stack: 'at validate (zod.js:123)',
    source: 'use-case',
    metadata: null,
    context: '{"inputMonto":-100}',
    duration_ms: null,
    ...overrides,
  };
}

describe('rowToAuditEvent', () => {
  it('maps a full audit row', () => {
    const event = rowToAuditEvent(makeRawAuditRow());
    expect(event.id).toBe('row-1');
    expect(event.operation).toBe('venta.registrar');
    expect(event.entityType).toBe('sale');
    expect(event.entityId).toBe('sale-abc');
    expect(event.userId).toBe('usr-01');
    expect(event.deviceId).toBe('dev-001');
    expect(event.businessId).toBe('biz-01');
    expect(event.status).toBe('success');
    expect(event.metadata).toBeUndefined();
  });

  it('parses metadata JSON', () => {
    const event = rowToAuditEvent(
      makeRawAuditRow({ metadata: '{"amount":5000}' }),
    );
    expect(event.metadata).toEqual({ amount: 5000 });
  });

  it('handles invalid metadata JSON gracefully', () => {
    const event = rowToAuditEvent(
      makeRawAuditRow({ metadata: 'not json{' }),
    );
    expect(event.metadata).toBeUndefined();
  });

  it('maps error fields from audit row', () => {
    const event = rowToAuditEvent(
      makeRawAuditRow({
        status: 'error',
        error_name: 'TypeError',
        error_message: 'Validation failed',
      }),
    );
    expect(event.status).toBe('error');
    expect(event.errorCode).toBe('TypeError');
    expect(event.errorMessage).toBe('Validation failed');
  });

  it('maps durationMs', () => {
    const event = rowToAuditEvent(makeRawAuditRow({ duration_ms: 42 }));
    expect(event.durationMs).toBe(42);
  });

  it('defaults null entity fields to empty strings', () => {
    const event = rowToAuditEvent(
      makeRawAuditRow({ entity_type: null, entity_id: null, business_id: null }),
    );
    expect(event.entityType).toBe('');
    expect(event.entityId).toBe('');
    expect(event.businessId).toBe('');
  });

  it('defaults null status to success', () => {
    const event = rowToAuditEvent(makeRawAuditRow({ status: null }));
    expect(event.status).toBe('success');
  });
});

describe('rowToErrorEntry', () => {
  it('maps a full error row', () => {
    const entry = rowToErrorEntry(makeRawErrorRow());
    expect(entry.id).toBe('err-1');
    expect(entry.source).toBe('use-case');
    expect(entry.errorName).toBe('ZodError');
    expect(entry.errorMessage).toBe('monto must be > 0');
    expect(entry.errorStack).toBe('at validate (zod.js:123)');
    expect(entry.context).toEqual({ inputMonto: -100 });
  });

  it('defaults null source to system', () => {
    const entry = rowToErrorEntry(makeRawErrorRow({ source: null }));
    expect(entry.source).toBe('system');
  });

  it('defaults null errorName to UnknownError', () => {
    const entry = rowToErrorEntry(makeRawErrorRow({ error_name: null }));
    expect(entry.errorName).toBe('UnknownError');
  });

  it('defaults null errorMessage to empty string', () => {
    const entry = rowToErrorEntry(makeRawErrorRow({ error_message: null }));
    expect(entry.errorMessage).toBe('');
  });

  it('handles null context', () => {
    const entry = rowToErrorEntry(makeRawErrorRow({ context: null }));
    expect(entry.context).toBeUndefined();
  });

  it('handles invalid context JSON', () => {
    const entry = rowToErrorEntry(makeRawErrorRow({ context: '{bad json' }));
    expect(entry.context).toBeUndefined();
  });
});

describe('rowToTimelineEntry', () => {
  it('maps audit row to timeline entry with type=audit', () => {
    const entry = rowToTimelineEntry(makeRawAuditRow());
    expect(entry.type).toBe('audit');
    if (entry.type === 'audit') {
      expect(entry.operation).toBe('venta.registrar');
    }
  });

  it('maps error row to timeline entry with type=error', () => {
    const entry = rowToTimelineEntry(makeRawErrorRow());
    expect(entry.type).toBe('error');
    if (entry.type === 'error') {
      expect(entry.errorName).toBe('ZodError');
    }
  });
});
