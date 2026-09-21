import { describe, expect, it } from 'vitest';
import {
  EntitlementSchema,
  entitlementState,
  type Entitlement,
} from '../../src/entities/entitlement.js';

const DAY = 86_400_000;
const T0 = Date.parse('2026-09-11T12:00:00Z');
const iso = (ms: number): string => new Date(ms).toISOString();

const base: Entitlement = {
  businessId: '01JBUSINESS',
  plan: 'xangarro',
  limits: { operators: 2, devices: 2, transactionsPerMonth: 10_000, activeProducts: 1_000 },
  features: ['stock', 'barcode'],
  capabilities: {
    estadosFinancieros: true,
    informeMensual: false,
    permisosPorUsuario: false,
    asesor: 'diario',
    cobrosIntegrados: true,
  },
  validUntil: iso(T0 + 10 * DAY),
  graceUntil: iso(T0 + 17 * DAY),
  issuedAt: iso(T0 - DAY),
  serverTime: iso(T0 - DAY),
  version: 1,
};
const fresh = { nowAnchored: iso(T0), lastPullAt: iso(T0 - DAY) };

describe('EntitlementSchema', () => {
  it('parses a valid payload', () => {
    expect(EntitlementSchema.parse(base).plan).toBe('xangarro');
  });
  it('rejects an unknown feature key, a bad plan, and a non-ISO date', () => {
    expect(() => EntitlementSchema.parse({ ...base, features: ['jetpack'] })).toThrow();
    expect(() => EntitlementSchema.parse({ ...base, plan: 'gold' })).toThrow();
    expect(() => EntitlementSchema.parse({ ...base, validUntil: 'mañana' })).toThrow();
  });
});

describe('entitlementState', () => {
  it('is active inside the paid window with a recent pull', () => {
    expect(entitlementState(base, fresh)).toBe('active');
  });
  it('is grace after validUntil but before graceUntil', () => {
    expect(entitlementState(base, { ...fresh, nowAnchored: iso(T0 + 12 * DAY) })).toBe('grace');
  });
  it('is lapsed after graceUntil', () => {
    expect(entitlementState(base, { ...fresh, nowAnchored: iso(T0 + 20 * DAY) })).toBe('lapsed');
  });
  it('offline staleness degrades even a paid-up entitlement, gracefully then fully', () => {
    const paidLong = { ...base, validUntil: iso(T0 + 400 * DAY), graceUntil: iso(T0 + 407 * DAY) };
    expect(
      entitlementState(paidLong, { nowAnchored: iso(T0 + 31 * DAY), lastPullAt: iso(T0) }),
    ).toBe('grace');
    expect(
      entitlementState(paidLong, { nowAnchored: iso(T0 + 40 * DAY), lastPullAt: iso(T0) }),
    ).toBe('lapsed');
    expect(entitlementState(paidLong, { nowAnchored: iso(T0 + 40 * DAY), lastPullAt: null })).toBe(
      'active',
    );
  });
  it('treats malformed dates as lapsed (safe fallback, never a crash)', () => {
    expect(entitlementState({ ...base, graceUntil: 'x' }, fresh)).toBe('lapsed');
    expect(entitlementState(base, { ...fresh, nowAnchored: 'not-a-date' })).toBe('lapsed');
  });
});
