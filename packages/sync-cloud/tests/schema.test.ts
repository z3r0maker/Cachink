/**
 * Sanity-check the PowerSync client-schema descriptors (ADR-035) against
 * the Drizzle source-of-truth in `@cachink/data/schema`. If one drifts,
 * sync payloads quietly lose columns — this test surfaces the drift at
 * dev time.
 */

import { describe, expect, it } from 'vitest';
import { SYNCED_TABLES, TABLES } from '../src/schema/index.js';

describe('PowerSync client schema', () => {
  it('lists the 10 synced tables in the same order as ADR-029', () => {
    expect(SYNCED_TABLES).toEqual([
      'businesses',
      'sales',
      'expenses',
      'products',
      'inventory_movements',
      'employees',
      'clients',
      'client_payments',
      'day_closes',
      'recurring_expenses',
    ]);
  });

  it('provides a TableSpec for every synced table', () => {
    for (const t of SYNCED_TABLES) {
      expect(TABLES.some((spec) => spec.name === t)).toBe(true);
    }
  });

  it('every table carries the 5 audit columns', () => {
    const required = ['business_id', 'device_id', 'created_at', 'updated_at', 'deleted_at'];
    for (const spec of TABLES) {
      const cols = new Set(spec.columns.map((c) => c.name));
      for (const col of required) {
        expect(cols.has(col), `${spec.name} missing ${col}`).toBe(true);
      }
    }
  });

  it('money columns are typed as numeric (bigint-safe)', () => {
    const moneyCols = [
      'monto_centavos',
      'costo_unit_centavos',
      'salario_centavos',
      'efectivo_esperado_centavos',
      'efectivo_contado_centavos',
      'diferencia_centavos',
    ];
    for (const spec of TABLES) {
      for (const col of spec.columns) {
        if (moneyCols.includes(col.name)) {
          expect(col.type).toBe('numeric');
        }
      }
    }
  });
});
