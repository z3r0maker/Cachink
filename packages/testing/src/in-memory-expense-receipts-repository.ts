/**
 * In-memory ExpenseReceiptsRepository (M-18, ADR-149): insert-only rows, the
 * receipt per gasto by `latestExpenseReceipts` — the same rule the Drizzle
 * implementation and the portal read by.
 */
import type {
  DeviceId,
  ExpenseId,
  ExpenseReceipt,
  ExpenseReceiptId,
  NewExpenseReceipt,
} from '@xangarro/domain';
import { latestExpenseReceipts, newEntityId, now, productImageStamp } from '@xangarro/domain';
import type { ExpenseReceiptsRepository } from '@xangarro/data';

export class InMemoryExpenseReceiptsRepository implements ExpenseReceiptsRepository {
  private readonly rows: ExpenseReceipt[] = [];
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewExpenseReceipt): Promise<ExpenseReceipt> {
    const previous = await this.findLatestByGasto(input.gastoId);
    const ts = productImageStamp(now(), previous?.createdAt ?? null);
    const row: ExpenseReceipt = {
      id: newEntityId<ExpenseReceiptId>(),
      gastoId: input.gastoId,
      mime: 'image/webp',
      bytes: input.bytes,
      width: input.width,
      height: input.height,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdByUserId: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.push(row);
    return row;
  }

  async findLatestByGasto(gastoId: ExpenseId): Promise<ExpenseReceipt | null> {
    const mine = this.rows.filter((r) => r.gastoId === gastoId);
    return latestExpenseReceipts(mine).get(gastoId) ?? null;
  }

  async findGastosWithReceipt(gastoIds: readonly ExpenseId[]): Promise<ReadonlySet<ExpenseId>> {
    const asked = new Set(gastoIds);
    const winners = latestExpenseReceipts(this.rows.filter((r) => asked.has(r.gastoId)));
    return new Set(winners.keys());
  }
}
