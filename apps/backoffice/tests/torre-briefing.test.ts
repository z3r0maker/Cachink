import { describe, expect, it } from 'vitest';
import type { BusinessId, SupportItem } from '@xangarro/domain';

import type { CapacityMetric } from '@/server/capacity/status';
import { UNKNOWN_BILLING, type BillingSnapshot } from '@/server/billing/port';
import type { TenantRow } from '@/server/tenants/list';
import { briefing } from '@/server/torre/briefing';

const NOW = new Date('2026-09-25T18:00:00Z');

function tenant(
  p: Partial<TenantRow['summary']>,
  billing: Partial<BillingSnapshot> = {},
): TenantRow {
  return {
    summary: {
      id: '01JAAAAAAAAAAAAAAAAAAAAAAA' as BusinessId,
      nombre: 'Taquería Don Pedro',
      createdAt: '2026-01-02T00:00:00Z',
      ownerEmail: 'pedro@taqueria.mx',
      devicesTotal: 2,
      devicesActive: 2,
      lastSyncAt: '2026-09-25T10:00:00Z',
      lastOwnerLoginAt: null,
      ...p,
    },
    billing: { ...UNKNOWN_BILLING, ...billing },
    plan: { base: null, effective: null, effect: { kind: 'none' } } as unknown as TenantRow['plan'],
  };
}

const ok: CapacityMetric[] = [
  { key: 'dbSizeS2', stage: 'S2', value: 1, trigger: 10, status: 'ok' },
  { key: 'syncP95', stage: 'S2', value: null, trigger: 800, status: 'sin-datos' },
];

describe('briefing', () => {
  it('is calm when nothing needs anyone', () => {
    const b = briefing({ tenants: [tenant({})], openItems: [], capacity: ok, now: NOW });
    expect(b.mood).toBe('tranquilo');
    expect(b.items).toEqual([]);
  });

  it('flags a tenant whose devices stopped syncing, and goes on guard', () => {
    const b = briefing({
      tenants: [tenant({ lastSyncAt: '2026-05-12T12:00:00Z' })],
      openItems: [],
      capacity: ok,
      now: NOW,
    });
    expect(b.mood).toBe('guardia');
    expect(b.items[0]).toMatchObject({
      severity: 'alta',
      href: '/tenants/01JAAAAAAAAAAAAAAAAAAAAAAA',
    });
    expect(b.items[0]?.title).toContain('sin sincronizar 136 días');
    expect(b.line).toContain('sin sincronizar 136 días');
  });

  it('flags a brand-new tenant with no devices, and one without an owner', () => {
    const b = briefing({
      tenants: [
        tenant({
          nombre: 'ETOS',
          createdAt: '2026-09-25T09:00:00Z',
          devicesTotal: 0,
          devicesActive: 0,
          lastSyncAt: null,
        }),
        tenant({
          nombre: 'Conformance',
          ownerEmail: null,
          devicesTotal: 0,
          devicesActive: 0,
          lastSyncAt: null,
        }),
      ],
      openItems: [],
      capacity: ok,
      now: NOW,
    });
    expect(b.items.map((i) => [i.severity, i.title])).toEqual([
      ['media', 'ETOS · se dio de alta hoy'],
      ['baja', 'Conformance · sin dueño en el portal'],
    ]);
  });

  it('raises the alarm for an urgent inbox item or a capacity threshold crossed', () => {
    const urgent = { id: 'X', title: 'Error en cobro', urgent: true } as unknown as SupportItem;
    expect(briefing({ tenants: [], openItems: [urgent], capacity: ok, now: NOW }).mood).toBe(
      'alarma',
    );
    const red: CapacityMetric[] = [
      { key: 'dbSizeS2', stage: 'S2', value: 11, trigger: 10, status: 'red' },
    ];
    const b = briefing({ tenants: [], openItems: [], capacity: red, now: NOW });
    expect(b.mood).toBe('alarma');
    expect(b.line.startsWith('¡Ay, ay, ay!')).toBe(true);
  });

  it('says so when capacity could not be measured, without raising the mood', () => {
    const b = briefing({ tenants: [], openItems: [], capacity: null, now: NOW });
    expect(b.items[0]?.severity).toBe('sistema');
    expect(b.mood).toBe('tranquilo');
  });
});
