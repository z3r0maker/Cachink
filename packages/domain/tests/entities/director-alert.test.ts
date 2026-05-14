import { describe, expect, it } from 'vitest';
import { DirectorAlertSchema, AlertSeverityEnum, AlertSourceEnum } from '../../src/entities/director-alert.js';

const VALID_ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
const VALID_AUDIT = {
  businessId: VALID_ULID,
  deviceId: VALID_ULID,
  createdAt: '2026-05-09T12:00:00.000Z',
  updatedAt: '2026-05-09T12:00:00.000Z',
  deletedAt: null,
};

describe('DirectorAlertSchema', () => {
  it('validates a complete alert', () => {
    const result = DirectorAlertSchema.safeParse({
      id: VALID_ULID,
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'alerts.stockBajo',
      message: 'Tortilla tiene 2 unidades',
      read: false,
      actionRoute: '/productos',
      metadata: '{"productoId":"01HZ8XQN9GZJXV8AKQ5X0C7BJZ"}',
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required titleKey field', () => {
    const result = DirectorAlertSchema.safeParse({
      id: VALID_ULID,
      source: 'stock-bajo',
      severity: 'warning',
      message: 'Some message',
      read: false,
      actionRoute: null,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid branded ID', () => {
    const result = DirectorAlertSchema.safeParse({
      id: 'invalid-id',
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'alerts.stockBajo',
      message: 'Test',
      read: false,
      actionRoute: null,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid severity enum value', () => {
    const result = DirectorAlertSchema.safeParse({
      id: VALID_ULID,
      source: 'stock-bajo',
      severity: 'fatal',
      titleKey: 'alerts.stockBajo',
      message: 'Test',
      read: false,
      actionRoute: null,
      ...VALID_AUDIT,
    });
    expect(result.success).toBe(false);
  });
});

describe('AlertSeverityEnum', () => {
  it('accepts info, warning, and critical', () => {
    expect(AlertSeverityEnum.safeParse('info').success).toBe(true);
    expect(AlertSeverityEnum.safeParse('warning').success).toBe(true);
    expect(AlertSeverityEnum.safeParse('critical').success).toBe(true);
  });
});

describe('AlertSourceEnum', () => {
  it('accepts known sources', () => {
    expect(AlertSourceEnum.safeParse('stock-bajo').success).toBe(true);
    expect(AlertSourceEnum.safeParse('caja-discrepancia').success).toBe(true);
    expect(AlertSourceEnum.safeParse('credito-vencido').success).toBe(true);
  });

  it('rejects unknown source', () => {
    expect(AlertSourceEnum.safeParse('unknown-source').success).toBe(false);
  });
});
