import { describe, expect, it } from 'vitest';
import { resolveEffectiveFlags } from '../../src/entities/effective-flags.js';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '../../src/entities/feature-flags.js';

const ALL_ON: FeatureFlags = {
  stock: true,
  barcode: true,
  conversionMateriaPrima: true,
  conversionAutomatica: true,
  auditoriaInventario: true,
  merma: true,
  ventasCredito: true,
};

describe('resolveEffectiveFlags', () => {
  it('is on only when platform, plan and tenant all say so', () => {
    const r = resolveEffectiveFlags({ platform: ALL_ON, plan: 'xangarrote', tenant: ALL_ON });
    expect(r).toEqual(ALL_ON);
  });

  it('platform off wins over plan and tenant', () => {
    const platform = { ...ALL_ON, merma: false };
    const r = resolveEffectiveFlags({ platform, plan: 'xangarrote', tenant: ALL_ON });
    expect(r.merma).toBe(false);
  });

  it('a plan that excludes the feature wins over platform and tenant', () => {
    const r = resolveEffectiveFlags({ platform: ALL_ON, plan: 'xangarrito', tenant: ALL_ON });
    expect(r.stock).toBe(false);
    expect(r.barcode).toBe(false);
  });

  it('tenant off wins over platform and plan', () => {
    const tenant = { ...DEFAULT_FEATURE_FLAGS, stock: false };
    const r = resolveEffectiveFlags({ platform: ALL_ON, plan: 'xangarro', tenant });
    expect(r.stock).toBe(false);
  });

  it('a dependency parent being off cascades to its children', () => {
    const tenant = { ...ALL_ON, stock: false };
    const r = resolveEffectiveFlags({ platform: ALL_ON, plan: 'xangarrote', tenant });
    expect(r.merma).toBe(false);
    expect(r.conversionMateriaPrima).toBe(false);
    expect(r.conversionAutomatica).toBe(false);
    expect(r.ventasCredito).toBe(true);
  });
});
