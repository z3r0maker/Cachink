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
      RIF: 0.02,
      RESICO: 0.0125,
      Asalariados: 0.25,
      Otro: 0.30,
    };
    const result = IsrDefaultsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts boundary values (0 and 1)', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: 0,
      RESICO: 1,
      Asalariados: 0.5,
      Otro: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a rate above 1', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: 1.5,
      RESICO: 0.01,
      Asalariados: 0.25,
      Otro: 0.30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a rate below 0', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: -0.01,
      RESICO: 0.01,
      Asalariados: 0.25,
      Otro: 0.30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-number value', () => {
    const result = IsrDefaultsSchema.safeParse({
      RIF: 'hello',
      RESICO: 0.01,
      Asalariados: 0.25,
      Otro: 0.30,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a partial record (missing regimes)', () => {
    const result = IsrDefaultsSchema.safeParse({ RIF: 0.02 });
    expect(result.success).toBe(false);
  });
});

describe('ISR_DEFAULTS_SEED', () => {
  it('has an entry for every regime in REGIMENES_FISCALES', () => {
    for (const regimen of REGIMENES_FISCALES) {
      expect(ISR_DEFAULTS_SEED[regimen]).toBeDefined();
    }
  });

  it('all seed values are numbers in [0, 1]', () => {
    for (const regimen of REGIMENES_FISCALES) {
      const value = ISR_DEFAULTS_SEED[regimen]!;
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('validates against IsrDefaultsSchema', () => {
    const result = IsrDefaultsSchema.safeParse(ISR_DEFAULTS_SEED);
    expect(result.success).toBe(true);
  });
});
