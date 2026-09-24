import { describe, expect, it } from 'vitest';
import { FALLBACK_PLAN, PLAN_IDS, PLAN_LIMITS, PlanIdSchema } from '../../src/entities/plan.js';
import { FEATURE_FLAG_KEYS } from '../../src/entities/feature-flags.js';

describe('plan', () => {
  it('gives each plan dueño + N empleados: N devices and N + 1 operators (ADR-104)', () => {
    expect([PLAN_LIMITS.xangarrito.devices, PLAN_LIMITS.xangarrito.operators]).toEqual([1, 2]);
    expect([PLAN_LIMITS.xangarro.devices, PLAN_LIMITS.xangarro.operators]).toEqual([2, 3]);
    expect([PLAN_LIMITS.xangarrote.devices, PLAN_LIMITS.xangarrote.operators]).toEqual([5, 6]);
    for (const id of PLAN_IDS) {
      expect(PLAN_LIMITS[id].operators).toBe(PLAN_LIMITS[id].devices + 1);
    }
  });

  it('the tiers carry the two ADR-065 metrics: 300/50 · 10k/1k · 30k/5k', () => {
    expect(PLAN_LIMITS.xangarrito.transactionsPerMonth).toBe(300);
    expect(PLAN_LIMITS.xangarrito.activeProducts).toBe(50);
    expect(PLAN_LIMITS.xangarro.transactionsPerMonth).toBe(10_000);
    expect(PLAN_LIMITS.xangarro.activeProducts).toBe(1_000);
    expect(PLAN_LIMITS.xangarrote.transactionsPerMonth).toBe(30_000);
    expect(PLAN_LIMITS.xangarrote.activeProducts).toBe(5_000);
  });

  it('includes the contador informe on both paid tiers (ADR-090)', () => {
    expect(PLAN_LIMITS.xangarrito.capabilities.informeMensual).toBe(false);
    expect(PLAN_LIMITS.xangarro.capabilities.informeMensual).toBe(true);
    expect(PLAN_LIMITS.xangarrote.capabilities.informeMensual).toBe(true);
  });

  it('every plan feature is a known flag key and higher plans are supersets', () => {
    for (const id of PLAN_IDS) {
      for (const f of PLAN_LIMITS[id].features) expect(FEATURE_FLAG_KEYS).toContain(f);
    }
    for (const f of PLAN_LIMITS.xangarro.features) {
      expect(PLAN_LIMITS.xangarrote.features).toContain(f);
    }
  });

  it('rejects an unknown plan id and falls back to xangarrito', () => {
    expect(() => PlanIdSchema.parse('enterprise')).toThrow();
    expect(FALLBACK_PLAN).toBe('xangarrito');
  });
});
