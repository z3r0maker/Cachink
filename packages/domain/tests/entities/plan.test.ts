import { describe, expect, it } from 'vitest';
import { FALLBACK_PLAN, PLAN_IDS, PLAN_LIMITS, PlanIdSchema } from '../../src/entities/plan.js';
import { FEATURE_FLAG_KEYS } from '../../src/entities/feature-flags.js';

describe('plan', () => {
  it('defines limits for every plan id and devices equal operators', () => {
    for (const id of PLAN_IDS) {
      expect(PLAN_LIMITS[id].devices).toBe(PLAN_LIMITS[id].operators);
    }
  });

  it('xangarrito is capped at 50 records/month; paid plans are unlimited', () => {
    expect(PLAN_LIMITS.xangarrito.recordsPerMonth).toBe(50);
    expect(PLAN_LIMITS.xangarro.recordsPerMonth).toBeNull();
    expect(PLAN_LIMITS.xangarrote.recordsPerMonth).toBeNull();
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
