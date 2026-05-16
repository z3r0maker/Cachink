/**
 * Drizzle-backed {@link CancelacionLogsRepository}.
 *
 * Part of the Cancelaciones y Devoluciones feature.
 */

import { and, asc, eq, gte, lte } from 'drizzle-orm';
import type {
  BusinessId,
  CancelacionLog,
  CancelacionLogId,
  DeviceId,
  IsoTimestamp,
  Money,
  NewCancelacionLog,
  PaymentMethod,
  ProductId,
  SaleId,
  UserId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CancelacionLogsRepository } from '../cancelacion-logs-repository.js';
import { cancelacionLogs } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type LogRow = typeof cancelacionLogs.$inferSelect;

export class DrizzleCancelacionLogsRepository
  implements CancelacionLogsRepository
{
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(
    db: CachinkDatabase,
    deviceId: DeviceId,
    userId: UserId | null = null,
  ) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewCancelacionLog): Promise<CancelacionLog> {
    const id = newEntityId<CancelacionLogId>();
    const ts = now();
    const row = {
      id,
      saleId: input.saleId,
      cancelledByUserId: input.cancelledByUserId,
      motivo: input.motivo,
      montoOriginalCentavos: input.montoOriginalCentavos,
      metodoOriginal: input.metodoOriginal,
      cashReturnedCentavos: input.cashReturnedCentavos ?? null,
      stockReversed: input.stockReversed ?? false,
      cantidadDevuelta: input.cantidadDevuelta ?? null,
      productoId: input.productoId ?? null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(cancelacionLogs).values(row).run();
    return this.#mapRow(row);
  }

  async findById(
    id: CancelacionLogId,
  ): Promise<CancelacionLog | null> {
    const row = await this.#db
      .select()
      .from(cancelacionLogs)
      .where(eq(cancelacionLogs.id, id))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findBySaleId(
    saleId: SaleId,
  ): Promise<CancelacionLog | null> {
    const row = await this.#db
      .select()
      .from(cancelacionLogs)
      .where(eq(cancelacionLogs.saleId, saleId))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CancelacionLog[]> {
    const rows = await this.#db
      .select()
      .from(cancelacionLogs)
      .where(
        and(
          eq(cancelacionLogs.businessId, businessId),
          gte(cancelacionLogs.createdAt, from),
          lte(cancelacionLogs.createdAt, to + 'Z'),
        ),
      )
      .orderBy(asc(cancelacionLogs.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  #mapRow(row: LogRow): CancelacionLog {
    return {
      id: row.id as CancelacionLogId,
      saleId: row.saleId as SaleId,
      cancelledByUserId: row.cancelledByUserId as UserId,
      motivo: row.motivo,
      montoOriginalCentavos: row.montoOriginalCentavos as Money,
      metodoOriginal: row.metodoOriginal as PaymentMethod,
      cashReturnedCentavos: (row.cashReturnedCentavos ?? null) as Money | null,
      stockReversed: row.stockReversed,
      cantidadDevuelta: row.cantidadDevuelta ?? null,
      productoId: (row.productoId ?? null) as ProductId | null,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
