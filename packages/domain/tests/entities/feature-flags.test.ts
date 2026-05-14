import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_FLAG_KEYS,
  canEnableFlag,
  parseFeatureFlags,
  resolveDisableCascade,
  type FeatureFlags,
} from '../../src/entities/feature-flags.js';

describe('feature-flags', () => {
  describe('DEFAULT_FEATURE_FLAGS', () => {
    it('covers all FEATURE_FLAG_KEYS', () => {
      for (const key of FEATURE_FLAG_KEYS) {
        expect(key in DEFAULT_FEATURE_FLAGS).toBe(true);
      }
    });

    it('has stock ON by default', () => {
      expect(DEFAULT_FEATURE_FLAGS.stock).toBe(true);
    });

    it('has everything else OFF by default', () => {
      const others = FEATURE_FLAG_KEYS.filter(
        (k) => k !== 'stock',
      );
      for (const key of others) {
        expect(DEFAULT_FEATURE_FLAGS[key]).toBe(false);
      }
    });
  });

  describe('resolveDisableCascade', () => {
    it('disables stock → cascades conversion, auditoria, merma OFF', () => {
      const flags: FeatureFlags = {
        stock: true,
        conversionMateriaPrima: true,
        conversionAutomatica: true,
        caja: true,
        auditoriaInventario: true,
        merma: true,
        ventasCredito: true,
      };
      const result = resolveDisableCascade(flags, 'stock');

      expect(result.stock).toBe(false);
      expect(result.conversionMateriaPrima).toBe(false);
      expect(result.conversionAutomatica).toBe(false);
      expect(result.auditoriaInventario).toBe(false);
      expect(result.merma).toBe(false);
      // Independent flags stay ON
      expect(result.caja).toBe(true);
      expect(result.ventasCredito).toBe(true);
    });

    it('disables conversionMateriaPrima → cascades conversionAutomatica OFF', () => {
      const flags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        stock: true,
        conversionMateriaPrima: true,
        conversionAutomatica: true,
      };
      const result = resolveDisableCascade(
        flags,
        'conversionMateriaPrima',
      );

      expect(result.conversionMateriaPrima).toBe(false);
      expect(result.conversionAutomatica).toBe(false);
      // stock stays ON
      expect(result.stock).toBe(true);
    });

    it('disables caja → no cascading (independent flag)', () => {
      const flags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        caja: true,
        stock: true,
      };
      const result = resolveDisableCascade(flags, 'caja');

      expect(result.caja).toBe(false);
      expect(result.stock).toBe(true);
    });
  });

  describe('canEnableFlag', () => {
    it('allows enabling merma when stock ON', () => {
      const flags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        stock: true,
      };
      expect(canEnableFlag(flags, 'merma')).toBe(true);
    });

    it('blocks enabling merma when stock OFF', () => {
      const flags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        stock: false,
      };
      expect(canEnableFlag(flags, 'merma')).toBe(false);
    });

    it('allows enabling caja regardless of other flags', () => {
      const flags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        stock: false,
      };
      expect(canEnableFlag(flags, 'caja')).toBe(true);
    });

    it('blocks conversionAutomatica when conversionMateriaPrima OFF', () => {
      const flags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        stock: true,
        conversionMateriaPrima: false,
      };
      expect(
        canEnableFlag(flags, 'conversionAutomatica'),
      ).toBe(false);
    });

    it('allows conversionAutomatica when conversionMateriaPrima ON', () => {
      const flags: FeatureFlags = {
        ...DEFAULT_FEATURE_FLAGS,
        stock: true,
        conversionMateriaPrima: true,
      };
      expect(
        canEnableFlag(flags, 'conversionAutomatica'),
      ).toBe(true);
    });
  });

  describe('parseFeatureFlags', () => {
    it('parses valid JSON', () => {
      const json = JSON.stringify({
        stock: true,
        caja: true,
        merma: false,
      });
      const result = parseFeatureFlags(json);
      expect(result.stock).toBe(true);
      expect(result.caja).toBe(true);
      expect(result.merma).toBe(false);
      // Missing keys get defaults
      expect(result.ventasCredito).toBe(false);
    });

    it('returns defaults for invalid JSON', () => {
      const result = parseFeatureFlags('not-json');
      expect(result).toEqual(DEFAULT_FEATURE_FLAGS);
    });

    it('returns defaults for empty string', () => {
      const result = parseFeatureFlags('');
      expect(result).toEqual(DEFAULT_FEATURE_FLAGS);
    });

    it('ignores non-boolean values in JSON', () => {
      const json = JSON.stringify({ stock: 'yes', caja: 42 });
      const result = parseFeatureFlags(json);
      expect(result.stock).toBe(true); // default
      expect(result.caja).toBe(false); // default
    });
  });
});
