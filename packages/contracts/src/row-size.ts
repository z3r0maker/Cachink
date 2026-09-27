/**
 * How big one pushed row may be (audit DB3-SYNC-01 b). Free text and
 * JSON-as-text fields (products.atributos, notes, motives) have no length of
 * their own, so one runaway row could take a push past the 4.5 MB request
 * limit (413, every later capture queued behind it) or a pull page past the
 * same limit. The server refuses a bigger row as terminal `VALIDATION`; the
 * device refuses it before sending. Size is the UTF-8 bytes of the row's wire
 * JSON, measured the same way on both sides.
 */

import type { PushableTable } from './scope.js';
import { encodeJson } from './wire.js';

/** Bytes a pushed row may take — dozens of times any row the app writes. */
export const MAX_PUSH_ROW_BYTES = 16_384;

/**
 * Rows whose payload is a list by design: an inventory count carries a line
 * per product (about 200 B each), a credit delivery the ids of the sales it
 * settles. Below the 1.9 MB snapshot page (ADR-120), so one row always fits.
 */
const BY_TABLE: Readonly<Partial<Record<PushableTable, number>>> = {
  auditorias_inventario: 1_048_576,
  entregas_credito: 262_144,
};

export function maxPushRowBytes(table: PushableTable): number {
  return BY_TABLE[table] ?? MAX_PUSH_ROW_BYTES;
}

const isHigh = (c: number): boolean => c >= 0xd800 && c <= 0xdbff;
const isLow = (c: number): boolean => c >= 0xdc00 && c <= 0xdfff;

/** UTF-8 length of `s`; a lone surrogate counts as the 3-byte U+FFFD it becomes. */
export function utf8Bytes(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (isHigh(c) && isLow(s.charCodeAt(i + 1))) {
      n += 4;
      i += 1;
    } else n += 3;
  }
  return n;
}

/** The UTF-8 bytes of a row's wire JSON. */
export function pushRowBytes(row: unknown): number {
  return utf8Bytes(encodeJson(row));
}
