import { describe, expect, it } from 'vitest';
import {
  DirectorAlertSchema,
  AlertSeverityEnum,
  AlertSourceEnum,
  type DirectorAlert,
} from '../../src/entities/director-alert.js';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '../../src/entities/feature-flags.js';
import { filterAlertsByFlags } from '../../src/entities/notification-preferences.js';

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

describe('filterAlertsByFlags', () => {
  const VALID_ULID = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ';
  function makeAlert(source: string): DirectorAlert {
    return {
      id: VALID_ULID,
      source,
      severity: 'warning',
      titleKey: 'test',
      message: 'Test alert',
      read: false,
      actionRoute: null,
      metadata: '{}',
      businessId: VALID_ULID,
      deviceId: VALID_ULID,
      createdAt: '2026-05-09T12:00:00.000Z',
      updatedAt: '2026-05-09T12:00:00.000Z',
      deletedAt: null,
    } as unknown as DirectorAlert;
  }

  it('passes always-on sources regardless of flags', () => {
    const alerts = [
      makeAlert('caja-discrepancia'),
      makeAlert('caja-egreso-auto'),
      makeAlert('usuario-cambio'),
      makeAlert('feature-flag-cambio'),
      makeAlert('gasto-recurrente-pendiente'),
    ];
    const result = filterAlertsByFlags(alerts, DEFAULT_FEATURE_FLAGS);
    expect(result).toHaveLength(5);
  });

  it('blocks merma-threshold when merma is OFF', () => {
    const alerts = [makeAlert('merma-threshold')];
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, merma: false };
    expect(filterAlertsByFlags(alerts, flags)).toHaveLength(0);
  });

  it('passes merma-threshold when merma is ON', () => {
    const alerts = [makeAlert('merma-threshold')];
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, merma: true };
    expect(filterAlertsByFlags(alerts, flags)).toHaveLength(1);
  });

  it('blocks auditoria alerts when auditoriaInventario is OFF', () => {
    const alerts = [
      makeAlert('auditoria-pendiente'),
      makeAlert('auditoria-discrepancia'),
    ];
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, auditoriaInventario: false };
    expect(filterAlertsByFlags(alerts, flags)).toHaveLength(0);
  });

  it('passes stock-bajo when stock is ON', () => {
    const alerts = [makeAlert('stock-bajo')];
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, stock: true };
    expect(filterAlertsByFlags(alerts, flags)).toHaveLength(1);
  });

  it('blocks stock-bajo when stock is OFF', () => {
    const alerts = [makeAlert('stock-bajo')];
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, stock: false };
    expect(filterAlertsByFlags(alerts, flags)).toHaveLength(0);
  });

  it('filters mixed sources correctly', () => {
    const alerts = [
      makeAlert('stock-bajo'),         // stock ON → pass
      makeAlert('merma-threshold'),    // merma OFF → block
      makeAlert('caja-discrepancia'),  // always-on → pass
      makeAlert('credito-entrega'),    // ventasCredito OFF → block
    ];
    const flags: FeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      stock: true,
      merma: false,
      ventasCredito: false,
    };
    const result = filterAlertsByFlags(alerts, flags);
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.source)).toEqual(['stock-bajo', 'caja-discrepancia']);
  });
});
