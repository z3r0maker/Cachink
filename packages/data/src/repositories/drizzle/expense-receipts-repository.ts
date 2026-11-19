/**
 * Drizzle-backed {@link ExpenseReceiptsRepository} (M-18, ADR-149). Inserts
 * only: the change-log trigger on `expense_receipts` queues every row for the
 * push, which reads the base64 `bytes` back as the text it stored. The
 * receipt per gasto is `latestExpenseReceipts`, the rule the portal reads by.
 *
 * A second row for the same gasto is stamped after the first even in the
 * same millisecond (`productImageStamp`, the product photo's rule), so the
 * newer one wins by `createdAt` and not by the ULID's luck.
 */

import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  ExpenseId,
  ExpenseReceipt,
  ExpenseReceiptId,
  IsoTimestamp,
  NewExpenseReceipt,
  UserId,
} from '@xangarro/domain';
import { EXPENSE_RECEIPT_MIME, newEntityId, now, productImageStamp } from '@xangarro/domain';
import type { ExpenseReceiptsRepository } from '../expense-receipts-repository.js';
import { expenseReceipts } from '../../schema/index.js';
import type { XangarroDatabase } from './_db.js';

type ReceiptRow = typeof expenseReceipts.$inferSelect;

export class DrizzleExpenseReceiptsRepository implements ExpenseReceiptsRepository {
  readonly #db: XangarroDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: XangarroDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewExpenseReceipt): Promise<ExpenseReceipt> {
    const previous = await this.findLatestByGasto(input.gastoId);
    const ts = productImageStamp(now(), previous?.createdAt ?? null);
    const row: ReceiptRow = {
      id: newEntityId<ExpenseReceiptId>(),
      gastoId: input.gastoId,
      mime: EXPENSE_RECEIPT_MIME,
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: this.#userId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    await this.#db.insert(expenseReceipts).values(row).run();
    return mapRow(row);
  }

  async findLatestByGasto(gastoId: ExpenseId): Promise<ExpenseReceipt | null> {
    const row = await this.#db
      .select()
      .from(expenseReceipts)
      .where(and(eq(expenseReceipts.gastoId, gastoId), isNull(expenseReceipts.deletedAt)))
      .orderBy(desc(expenseReceipts.createdAt), desc(expenseReceipts.id))
      .limit(1)
      .get();
    return row ? mapRow(row) : null;
  }

  async findGastosWithReceipt(gastoIds: readonly ExpenseId[]): Promise<ReadonlySet<ExpenseId>> {
    if (gastoIds.length === 0) return new Set();
    const rows = await this.#db
      .selectDistinct({ gastoId: expenseReceipts.gastoId })
      .from(expenseReceipts)
      .where(
        and(inArray(expenseReceipts.gastoId, [...gastoIds]), isNull(expenseReceipts.deletedAt)),
      )
      .all();
    return new Set(rows.map((r) => r.gastoId as ExpenseId));
  }
}

function mapRow(row: ReceiptRow): ExpenseReceipt {
  return {
    id: row.id as ExpenseReceiptId,
    gastoId: row.gastoId as ExpenseId,
    mime: EXPENSE_RECEIPT_MIME,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    businessId: row.businessId as BusinessId,
    deviceId: row.deviceId as DeviceId,
    createdByUserId: (row.createdByUserId ?? null) as UserId | null,
    createdAt: row.createdAt as IsoTimestamp,
    updatedAt: row.updatedAt as IsoTimestamp,
    deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
  };
}
