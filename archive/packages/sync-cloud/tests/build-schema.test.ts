/**
 * `buildPowerSyncSchema` — Slice 8 C5. Verifies the factory walks the
 * `TABLES` data, calls the injected DSL ctors with the right shape,
 * and never imports `@powersync/*` (kept lazy by CLAUDE.md §7).
 */

import { describe, expect, it, vi } from 'vitest';
import { buildPowerSyncSchema, type PowerSyncDsl } from '../src/client/build-schema.js';
import { TABLES } from '../src/schema/index.js';

function fakeDsl(): {
  dsl: PowerSyncDsl;
  tableCtor: ReturnType<typeof vi.fn>;
  schemaCtor: ReturnType<typeof vi.fn>;
} {
  const tableCtor = vi.fn(function MockTable(this: object, config: unknown) {
    Object.assign(this, { _kind: 'table', config });
  });
  const schemaCtor = vi.fn(function MockSchema(this: object, tables: unknown) {
    Object.assign(this, { _kind: 'schema', tables });
  });
  const dsl: PowerSyncDsl = {
    column: {
      text: () => ({ _type: 'text' }),
      integer: () => ({ _type: 'integer' }),
      real: () => ({ _type: 'real' }),
      numeric: () => ({ _type: 'numeric' }),
    },
    Table: tableCtor as unknown as PowerSyncDsl['Table'],
    Schema: schemaCtor as unknown as PowerSyncDsl['Schema'],
  };
  return { dsl, tableCtor, schemaCtor };
}

describe('buildPowerSyncSchema', () => {
  it('constructs one Table per synced table', () => {
    const { dsl, tableCtor } = fakeDsl();
    buildPowerSyncSchema(dsl);
    expect(tableCtor).toHaveBeenCalledTimes(TABLES.length);
  });

  it('passes columns + indexes to each Table', () => {
    const { dsl, tableCtor } = fakeDsl();
    buildPowerSyncSchema(dsl);
    const businessesCall = tableCtor.mock.calls.find((args) => {
      const [config] = args as [{ columns: Record<string, unknown> }];
      return Object.prototype.hasOwnProperty.call(config.columns, 'nombre');
    });
    expect(businessesCall).toBeDefined();
    if (!businessesCall) return;
    const [config] = businessesCall as [
      { columns: Record<string, unknown>; indexes?: Record<string, string[]> },
    ];
    expect(config.columns).toHaveProperty('nombre');
    expect(config.columns).toHaveProperty('business_id');
    expect(config.indexes?.['idx_businesses_biz']).toEqual(['business_id']);
  });

  it('builds exactly one Schema with all table entries keyed by name', () => {
    const { dsl, schemaCtor } = fakeDsl();
    buildPowerSyncSchema(dsl);
    expect(schemaCtor).toHaveBeenCalledTimes(1);
    const [tables] = schemaCtor.mock.calls[0] as [Record<string, unknown>];
    for (const spec of TABLES) {
      expect(tables).toHaveProperty(spec.name);
    }
  });
});
