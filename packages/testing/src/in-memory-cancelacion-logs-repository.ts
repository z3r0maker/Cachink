/**
 * In-memory implementation of {@link CancelacionLogsRepository}.
 *
 * Part of the Cancelaciones y Devoluciones feature.
 */

import type {
  BusinessId,
  CancelacionLog,
  CancelacionLogId,
  DeviceId,
  NewCancelacionLog,
  ProductId,
  SaleId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CancelacionLogsRepository } from '@cachink/data';

export class InMemoryCancelacionLogsRepository
  implements CancelacionLogsRepository
{
  private readonly rows = new Map<CancelacionLogId, CancelacionLog>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewCancelacionLog): Promise<CancelacionLog> {
    const id = newEntityId<CancelacionLogId>();
    const ts = now();
    const row: CancelacionLog = {
      id,
      saleId: input.saleId,
      cancelledByUserId: input.cancelledByUserId,
      motivo: input.motivo,
      montoOriginalCentavos: input.montoOriginalCentavos,
      metodoOriginal: input.metodoOriginal,
      cashReturnedCentavos: input.cashReturnedCentavos ?? null,
      stockReversed: input.stockReversed ?? false,
      cantidadDevuelta: input.cantidadDevuelta ?? null,
      productoId: (input.productoId ?? null) as ProductId | null,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdByUserId: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(
    id: CancelacionLogId,
  ): Promise<CancelacionLog | null> {
    return this.rows.get(id) ?? null;
  }

  async findBySaleId(
    saleId: SaleId,
  ): Promise<CancelacionLog | null> {
    for (const row of this.rows.values()) {
      if (row.saleId === saleId) return row;
    }
    return null;
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CancelacionLog[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId &&
          r.createdAt >= from &&
          r.createdAt <= to + 'Z',
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /** Test helper: wipe all records. */
  _reset(): void {
    this.rows.clear();
  }
}
