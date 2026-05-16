/**
 * Tests for the RegimenFiscal domain entity (ISR defaults schema + seed).
 */

import { describe, it, expect } from 'vitest';
import {
  REGIMENES_FISCALES,
  IsrDefaultsSchema,
  ISR_DEFAULTS_SEED,
  type IsrDefaults,
} from '../../src/entities/index.js';

describe('REGIMENES_FISCALES', () => {
  it('contains four regimes', () => {
    expect(REGIMENES_FISCALES).toEqual(['RIF', 'RESICO', 'Asalariados', 'Otro']);
  });
});

describe('IsrDefaultsSchema', () => {
  it('validates a well-formed IsrDefaults record', () => {
    const valid: IsrDefaults = {
      RIF: 200,
      RESICO: 125,
      Asalariados: 2500,
      Otro: 3000,
    };
    const result = IsrDefaultsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts boundary values (0 and 10_000)', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: 0,
      RESICO: 10_000,
      Asalariados: 5000,
      Otro: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a rate above 10_000', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: 15_000,
      RESICO: 100,
      Asalariados: 2500,
      Otro: 3000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a rate below 0', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: -100,
      RESICO: 100,
      Asalariados: 2500,
      Otro: 3000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-number value', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: 'hello',
      RESICO: 100,
      Asalariados: 2500,
      Otro: 3000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a partial record (missing regimes)', () => {
    const result = IsrDefaultsSchema.safeParse({ RIF: 200 });
    expect(result.success).toBe(false);
  });
});

describe('ISR_DEFAULTS_SEED', () => {
  it('has an entry for every regime in REGIMENES_FISCALES', () => {
    for (const regimen of REGIMENES_FISCALES) {
      expect(ISR_DEFAULTS_SEED[regimen]).toBeDefined();
    }
  });

  it('all seed values are integers in [0, 10_000]', () => {
    for (const regimen of REGIMENES_FISCALES) {
      const value = ISR_DEFAULTS_SEED[regimen]!;
      expect(typeof value).toBe('number');
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(10_000);
    }
  });

  it('validates against IsrDefaultsSchema', () => {
    const result = IsrDefaultsSchema.safeParse(ISR_DEFAULTS_SEED);
    expect(result.success).toBe(true);
  });
});
