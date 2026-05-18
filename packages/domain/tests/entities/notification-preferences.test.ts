/**
 * NotificationPreferences tests — deriveDefaultPrefs, resolveEffectivePrefs,
 * isSourceLocked.
 *
 * Phase 11 — Director Notification Inbox.
 */

import { describe, expect, it } from 'vitest';
import {
  deriveDefaultPrefs,
  resolveEffectivePrefs,
  isSourceLocked,
  ALERT_SOURCE_FLAG_MAP,
} from '../../src/entities/notification-preferences';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlags } from '../../src/entities/feature-flags';

const ALL_ON: FeatureFlags = {
  stock: true,
  conversionMateriaPrima: true,
  conversionAutomatica: true,
  auditoriaInventario: true,
  merma: true,
  ventasCredito: true,
};

describe('deriveDefaultPrefs', () => {
  it('sets all sources to true when all flags are ON', () => {
    const prefs = deriveDefaultPrefs(ALL_ON);
    for (const source of Object.keys(ALERT_SOURCE_FLAG_MAP)) {
      expect(prefs[source]).toBe(true);
    }
  });

  it('sets feature-gated sources to false when their flag is OFF', () => {
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS, stock: false };
    const prefs = deriveDefaultPrefs(flags);
    expect(prefs['stock-bajo']).toBe(false);
    // Always-on sources should still be true
    expect(prefs['caja-discrepancia']).toBe(true);
    expect(prefs['usuario-cambio']).toBe(true);
  });

  it('respects ventasCredito flag for credito sources', () => {
    const flags: FeatureFlags = { ...ALL_ON, ventasCredito: false };
    const prefs = deriveDefaultPrefs(flags);
    expect(prefs['credito-entrega']).toBe(false);
    expect(prefs['credito-vencido']).toBe(false);
  });
});

describe('resolveEffectivePrefs', () => {
  it('preserves stored overrides when feature is ON', () => {
    const stored = { ...deriveDefaultPrefs(ALL_ON), 'stock-bajo': false };
    const effective = resolveEffectivePrefs(stored, ALL_ON);
    expect(effective['stock-bajo']).toBe(false); // Director override preserved
    expect(effective['caja-discrepancia']).toBe(true);
  });

  it('forces feature-gated sources OFF when flag is OFF', () => {
    // Director had enabled stock-bajo, but stock feature is now OFF
    const stored = { ...deriveDefaultPrefs(ALL_ON), 'stock-bajo': true };
    const flags: FeatureFlags = { ...ALL_ON, stock: false };
    const effective = resolveEffectivePrefs(stored, flags);
    expect(effective['stock-bajo']).toBe(false); // Forced by flag
  });

  it('does not touch always-on sources', () => {
    const stored = { ...deriveDefaultPrefs(ALL_ON), 'usuario-cambio': false };
    const flags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
    const effective = resolveEffectivePrefs(stored, flags);
    // Director suppressed it and no flag dependency → stays false
    expect(effective['usuario-cambio']).toBe(false);
  });
});

describe('isSourceLocked', () => {
  it('returns false for always-on sources', () => {
    expect(isSourceLocked('caja-discrepancia', DEFAULT_FEATURE_FLAGS)).toBe(false);
    expect(isSourceLocked('usuario-cambio', DEFAULT_FEATURE_FLAGS)).toBe(false);
  });

  it('returns true when parent flag is OFF', () => {
    const flags: FeatureFlags = { ...ALL_ON, merma: false };
    expect(isSourceLocked('merma-threshold', flags)).toBe(true);
  });

  it('returns false when parent flag is ON', () => {
    expect(isSourceLocked('merma-threshold', ALL_ON)).toBe(false);
  });
});
