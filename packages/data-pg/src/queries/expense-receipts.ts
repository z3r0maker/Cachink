import { desc, eq, inArray, isNull, and, sql } from 'drizzle-orm';

import { expenseReceipts } from '../schema/expense-receipts.js';
import { devices } from '../schema/portal.js';
import type { Tx } from '../sync/cursor.js';

/**
 * A gasto's receipt photo (ADR-149, M-18): rows the phone pushed, the newest
 * per gasto wins, no tombstone. Every statement runs inside the caller's
 * tenant transaction, so RLS scopes it; nothing filters by business here.
 */

/** The receipt as the portal serves it: the bytes, and their hash for the ETag. */
export interface ExpenseReceiptFile {
  readonly id: string;
  readonly mime: string;
  /** Base64, as every row object carries it. */
  readonly bytes: string;
  /** Hex SHA-256 of the decoded bytes, computed by Postgres. */
  readonly hash: string;
}

const newestFirst = [desc(expenseReceipts.createdAt), desc(expenseReceipts.id)] as const;

/** One gasto's receipt: its newest live row, `null` when it has none. */
export async function latestExpenseReceipt(
  tx: Tx,
  gastoId: string,
): Promise<ExpenseReceiptFile | null> {
  const [row] = await tx
    .select({
      id: expenseReceipts.id,
      mime: expenseReceipts.mime,
      bytes: expenseReceipts.bytes,
      hash: sql<unknown>`encode(sha256(${expenseReceipts.bytes}), 'hex')`,
    })
    .from(expenseReceipts)
    .where(and(eq(expenseReceipts.gastoId, gastoId), isNull(expenseReceipts.deletedAt)))
    .orderBy(...newestFirst)
    .limit(1);
  if (row === undefined) return null;
  return { id: row.id, mime: row.mime, bytes: row.bytes, hash: String(row.hash) };
}

/** A gasto's receipt as the Movimientos drawer describes it. */
export interface GastoReceiptRow {
  readonly gastoId: string;
  /** The row's id: it changes with the photo, so it versions the image URL. */
  readonly id: string;
  /** When the phone took it, ISO-8601. */
  readonly tomadaEl: string;
  /** The register's name, or null when the device row is gone. */
  readonly caja: string | null;
}

/**
 * Which of `gastoIds` have a receipt, with when and on which register the
 * newest was taken. A gasto with none is absent. Bounded by the ids given:
 * the Movimientos page asks for its ten.
 */
export async function receiptsOfGastos(
  tx: Tx,
  gastoIds: readonly string[],
): Promise<readonly GastoReceiptRow[]> {
  if (gastoIds.length === 0) return [];
  const rows = await tx
    .selectDistinctOn([expenseReceipts.gastoId], {
      gastoId: expenseReceipts.gastoId,
      id: expenseReceipts.id,
      tomadaEl: expenseReceipts.createdAt,
      caja: devices.nombre,
    })
    .from(expenseReceipts)
    .leftJoin(devices, eq(devices.id, expenseReceipts.deviceId))
    .where(and(inArray(expenseReceipts.gastoId, [...gastoIds]), isNull(expenseReceipts.deletedAt)))
    .orderBy(expenseReceipts.gastoId, ...newestFirst);
  return rows.map((r) => ({ ...r, tomadaEl: new Date(r.tomadaEl).toISOString() }));
}
