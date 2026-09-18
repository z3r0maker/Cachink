import 'server-only';

import type { PullableTable } from '@xangarro/contracts';

/**
 * Rows between Postgres and the wire, both directions (contract §3, §4, §5).
 *
 * Rows travel in the **domain** shape, because the contract validates them
 * with `wireSchema(DomainSchema)`. Postgres renders `timestamptz` as
 * `2026-01-02 15:00:00+00`, which is a valid timestamp and not the ISO 8601 the
 * domain requires — so it is converted on the way out, and a few JSON-text
 * columns are decoded on the way out and encoded on the way in.
 */
const TIMESTAMPS = ['createdAt', 'updatedAt', 'deletedAt'] as const;

export type Row = Record<string, unknown>;

export function toWire(row: Row): Row {
  const out: Row = { ...row };
  for (const key of TIMESTAMPS) {
    const v = out[key];
    if (typeof v === 'string') out[key] = new Date(v).toISOString();
  }
  return out;
}

/**
 * Columns stored as JSON text for device parity, which the **domain** types as
 * structures. They must be decoded or `wireSchema(DomainSchema)` rejects them.
 *
 * Deliberately absent: `users.permissions`. It is also JSON text, but
 * `UserSchema` does not declare it — the phone decodes it itself with
 * `parsePermissions` — so it travels as the string it is. Decoding it here
 * would send a shape the phone does not expect.
 *
 * Found by the conformance suite, which failed on `atributosProducto` alone.
 */
function decodeJson(row: Row, columns: readonly string[]): Row {
  const out: Row = { ...row };
  for (const c of columns) {
    if (typeof out[c] === 'string') out[c] = JSON.parse(out[c] as string) as unknown;
  }
  return out;
}

const productToWire = (row: Row): Row => toWire(decodeJson(row, ['atributos']));
const businessToWire = (row: Row): Row => toWire(decodeJson(row, ['atributosProducto']));

/** Operators never carry an email over the wire (contract §5). */
function userToWire(row: Row): Row {
  const { email: _email, ...rest } = row;
  return toWire(rest);
}

const OUT: Record<PullableTable, (row: Row) => Row> = {
  businesses: businessToWire,
  products: productToWire,
  users: userToWire,
  clients: toWire,
  employees: toWire,
  recurring_expenses: toWire,
  conversion_recetas: toWire,
};

/** A Postgres row of `table`, as a device receives it. */
export const rowToWire = (table: PullableTable, row: Row): Row => OUT[table](row);

/**
 * A pushed row, as Postgres stores it: structured values in text columns go
 * back to the JSON text the device also keeps (`products.atributos`).
 */
export function rowFromWire(row: Row): Row {
  const out: Row = { ...row };
  for (const [k, v] of Object.entries(out)) {
    if (v !== null && typeof v === 'object' && !(v instanceof Date)) out[k] = JSON.stringify(v);
  }
  return out;
}
