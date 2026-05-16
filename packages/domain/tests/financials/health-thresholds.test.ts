import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HEALTH_THRESHOLDS,
  HealthThresholdsSchema,
  evaluateHealth,
  type MetricThreshold,
} from '../../src/financials/health-thresholds.js';

describe('evaluateHealth', () => {
  const threshold: MetricThreshold = { healthy: 0.20, warning: 0.10 };

  it('returns null when value is null', () => {
    expect(evaluateHealth(null, threshold)).toBeNull();
  });

  // ── Normal scale (higher = better) ──

  it('healthy when value is at the healthy threshold', () => {
    expect(evaluateHealth(0.20, threshold)).toBe('healthy');
  });

  it('healthy when value exceeds the healthy threshold', () => {
    expect(evaluateHealth(0.50, threshold)).toBe('healthy');
  });

  it('warning when value is at the warning threshold', () => {
    expect(evaluateHealth(0.10, threshold)).toBe('warning');
  });

  it('warning when value is between warning and healthy', () => {
    expect(evaluateHealth(0.15, threshold)).toBe('warning');
  });

  it('critical when value is below warning', () => {
    expect(evaluateHealth(0.05, threshold)).toBe('critical');
  });

  it('critical when value is zero', () => {
    expect(evaluateHealth(0, threshold)).toBe('critical');
  });

  it('critical when value is negative', () => {
    expect(evaluateHealth(-0.10, threshold)).toBe('critical');
  });

  // ── Inverted scale (lower = better, e.g. días de cobranza) ──

  const inverted: MetricThreshold = { healthy: 30, warning: 60 };

  it('inverted: healthy when value is at the healthy threshold', () => {
    expect(evaluateHealth(30, inverted, true)).toBe('healthy');
  });

  it('inverted: healthy when value is below the healthy threshold', () => {
    expect(evaluateHealth(10, inverted, true)).toBe('healthy');
  });

  it('inverted: warning when value is at the warning threshold', () => {
    expect(evaluateHealth(60, inverted, true)).toBe('warning');
  });

  it('inverted: warning when value is between healthy and warning', () => {
    expect(evaluateHealth(45, inverted, true)).toBe('warning');
  });

  it('inverted: critical when value exceeds warning', () => {
    expect(evaluateHealth(90, inverted, true)).toBe('critical');
  });
});

describe('DEFAULT_HEALTH_THRESHOLDS', () => {
  it('has all 6 metrics defined', () => {
    expect(DEFAULT_HEALTH_THRESHOLDS.margenBruto).toBeDefined();
    expect(DEFAULT_HEALTH_THRESHOLDS.margenOperativo).toBeDefined();
    expect(DEFAULT_HEALTH_THRESHOLDS.margenNeto).toBeDefined();
    expect(DEFAULT_HEALTH_THRESHOLDS.razonDeLiquidez).toBeDefined();
    expect(DEFAULT_HEALTH_THRESHOLDS.rotacionInventario).toBeDefined();
    expect(DEFAULT_HEALTH_THRESHOLDS.diasPromedioCobranza).toBeDefined();
  });

  it('warning is always less than healthy for normal-scale metrics', () => {
    const normal = [
      DEFAULT_HEALTH_THRESHOLDS.margenBruto,
      DEFAULT_HEALTH_THRESHOLDS.margenOperativo,
      DEFAULT_HEALTH_THRESHOLDS.margenNeto,
      DEFAULT_HEALTH_THRESHOLDS.razonDeLiquidez,
      DEFAULT_HEALTH_THRESHOLDS.rotacionInventario,
    ];
    for (const t of normal) {
      expect(t.warning).toBeLessThan(t.healthy);
    }
  });

  it('warning is greater than healthy for inverted-scale dias cobranza', () => {
    const d = DEFAULT_HEALTH_THRESHOLDS.diasPromedioCobranza;
    expect(d.warning).toBeGreaterThan(d.healthy);
  });
});

describe('HealthThresholdsSchema', () => {
  it('validates DEFAULT_HEALTH_THRESHOLDS', () => {
    const result = HealthThresholdsSchema.safeParse(DEFAULT_HEALTH_THRESHOLDS);
    expect(result.success).toBe(true);
  });

  it('validates a custom thresholds object', () => {
    const result = HealthThresholdsSchema.safeParse({
      margenBruto: { healthy: 0.30, warning: 0.15 },
      margenOperativo: { healthy: 0.15, warning: 0.08 },
      margenNeto: { healthy: 0.10, warning: 0.05 },
      razonDeLiquidez: { healthy: 2.0, warning: 1.2 },
      rotacionInventario: { healthy: 6.0, warning: 3.0 },
      diasPromedioCobranza: { healthy: 20, warning: 45 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects when a metric is missing', () => {
    const result = HealthThresholdsSchema.safeParse({
      margenBruto: { healthy: 0.30, warning: 0.15 },
      // Missing other metrics
    });
    expect(result.success).toBe(false);
  });

  it('rejects when healthy is not a number', () => {
    const result = HealthThresholdsSchema.safeParse({
      ...DEFAULT_HEALTH_THRESHOLDS,
      margenBruto: { healthy: 'not-a-number', warning: 0.10 },
    });
    expect(result.success).toBe(false);
  });
});
