/**
 * Build a PowerSync `Schema` object from the platform-agnostic
 * `TABLES` data in `../schema/index.ts` (Slice 8 C5).
 *
 * Both `@powersync/react-native` and `@powersync/web` re-export a
 * `Schema` / `Table` / `column` API from `@powersync/common`. Rather
 * than importing the heavy native module here (which would defeat the
 * lazy-load contract), we accept the schema constructors as parameters
 * — the app shell passes the platform-correct factory.
 *
 * Returns the constructed `Schema` instance ready to feed into
 * `new PowerSyncDatabase({ schema, database })`.
 */

import { TABLES, type ColumnSpec, type TableSpec } from '../schema/index.js';

/** Subset of the PowerSync `column` factory we depend on. */
export interface PowerSyncColumnFactory {
  text(): unknown;
  integer(): unknown;
  real(): unknown;
  numeric(): unknown;
}

export interface PowerSyncTableCtor {
  new (config: { columns: Record<string, unknown>; indexes?: Record<string, string[]> }): unknown;
}

export interface PowerSyncSchemaCtor {
  new (tables: Record<string, unknown>): unknown;
}

export interface PowerSyncDsl {
  readonly column: PowerSyncColumnFactory;
  readonly Table: PowerSyncTableCtor;
  readonly Schema: PowerSyncSchemaCtor;
}

function columnFor(spec: ColumnSpec, dsl: PowerSyncDsl): unknown {
  switch (spec.type) {
    case 'integer':
      return dsl.column.integer();
    case 'real':
      return dsl.column.real();
    case 'numeric':
      return dsl.column.numeric();
    case 'text':
    default:
      return dsl.column.text();
  }
}

function tableFor(spec: TableSpec, dsl: PowerSyncDsl): unknown {
  const columns: Record<string, unknown> = {};
  for (const col of spec.columns) {
    columns[col.name] = columnFor(col, dsl);
  }
  const indexes: Record<string, string[]> = {};
  for (const idx of spec.indexes ?? []) {
    indexes[idx.name] = [...idx.columns];
  }
  return new dsl.Table({ columns, indexes });
}

/** Build a PowerSync `Schema` instance from the canonical `TABLES` spec. */
export function buildPowerSyncSchema(dsl: PowerSyncDsl): unknown {
  const tables: Record<string, unknown> = {};
  for (const spec of TABLES) {
    tables[spec.name] = tableFor(spec, dsl);
  }
  return new dsl.Schema(tables);
}
