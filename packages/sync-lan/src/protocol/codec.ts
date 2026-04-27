/**
 * encodeDelta / decodeDelta — the conversion between a row as it lives in
 * SQLite (bigint money, JS Date-ish strings, string-typed enums) and a row
 * as it travels over the wire (decimal-string money, ISO strings, same
 * enums) (ADR-029).
 *
 * Encoding rules:
 *  - bigint fields serialise as decimal strings (e.g. `450n` → `"450"`).
 *  - null stays null; undefined is dropped (JSON can't represent it).
 *  - Nothing else is transformed — dates, enums, booleans travel as-is.
 *
 * Decoding is the inverse: money columns for the target table are coerced
 * back to bigint. The applier is expected to run the result through the
 * domain Zod schema before inserting, so we don't re-validate here.
 */

import { MONEY_COLUMNS, type SyncedTable, SYNCED_TABLES } from './constants.js';
import { deltaSchema, type Delta } from './wire.js';

/** Snake_case column names we know hold bigint (money) values, per table. */
function moneyColumnsFor(table: SyncedTable): readonly string[] {
  return MONEY_COLUMNS[table] ?? [];
}

/**
 * Serialise a DB row into the wire-safe shape for a given table.
 *
 * @param table snake_case name of the table the row came from.
 * @param row plain row object as read from the DB (any extra keys are passed through).
 * @param op `'insert'` or `'update'` — soft-deletes are `'update'` with `deleted_at` set.
 */
export function encodeDelta(
  table: SyncedTable,
  row: Readonly<Record<string, unknown>>,
  op: Delta['op'],
): Delta {
  const moneyCols = new Set(moneyColumnsFor(table));
  const encodedRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    if (moneyCols.has(key)) {
      encodedRow[key] = encodeMoneyValue(key, value);
    } else if (typeof value === 'bigint') {
      // Unexpected bigint on a non-money column — treat as opaque text so we
      // still serialise reliably, but surface later if a test catches it.
      encodedRow[key] = String(value);
    } else {
      encodedRow[key] = value;
    }
  }

  const rowId = stringField(encodedRow['id'], 'id');
  const rowUpdatedAt = stringField(encodedRow['updated_at'], 'updated_at');
  const rowDeviceId = stringField(encodedRow['device_id'], 'device_id');

  return {
    table,
    op,
    rowId,
    rowUpdatedAt,
    rowDeviceId,
    row: encodedRow,
  };
}

/**
 * Parse an inbound Delta from the wire. Validates the envelope with Zod,
 * then coerces money columns back to bigint. Throws on validation failure
 * — callers should wrap the call in a try/catch and record the row as
 * rejected with reason `'invalid'`.
 */
export function decodeDelta(raw: unknown): Delta & { decodedRow: Record<string, unknown> } {
  const parsed = deltaSchema.parse(raw);
  const moneyCols = new Set(moneyColumnsFor(parsed.table));
  const decodedRow: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.row)) {
    decodedRow[key] = moneyCols.has(key) ? decodeMoneyValue(key, value) : value;
  }
  return { ...parsed, decodedRow };
}

function encodeMoneyValue(key: string, value: unknown): string {
  if (typeof value === 'bigint') return value.toString(10);
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value);
  throw new TypeError(
    `encodeDelta: money column "${key}" must be bigint, integer, or decimal string; got ${typeof value}`,
  );
}

function decodeMoneyValue(key: string, value: unknown): bigint | null {
  if (value === null) return null;
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value);
  throw new TypeError(`decodeDelta: money column "${key}" not decodable; got ${typeof value}`);
}

function stringField(value: unknown, column: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`encodeDelta: required column "${column}" missing or empty`);
  }
  return value;
}

/** Narrow helper for consumers who want to validate a table string at runtime. */
export function isSyncedTable(candidate: string): candidate is SyncedTable {
  return (SYNCED_TABLES as readonly string[]).includes(candidate);
}
