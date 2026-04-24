/**
 * Drizzle-backed {@link ClientPaymentsRepository}.
 */

import { and, desc, eq, isNull } from 'drizzle-orm';
import type {
  BusinessId,
  ClientPaymentId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  Money,
  NewClientPayment,
  PaymentMethod,
  SaleId,
} from '@cachink/domain';
import { ZERO, newEntityId, now, sum } from '@cachink/domain';
import type {
  ClientPayment,
  ClientPaymentsRepository,
} from '../client-payments-repository.js';
import { clientPayments } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type PaymentRow = typeof clientPayments.$inferSelect;

export class DrizzleClientPaymentsRepository implements ClientPaymentsRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewClientPayment): Promise<ClientPayment> {
    const id = newEntityId<ClientPaymentId>();
    const ts = now();
    const row = {
      id,
      ventaId: input.ventaId,
      fecha: input.fecha,
      montoCentavos: input.montoCentavos,
      metodo: input.metodo,
      nota: input.nota ?? null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(clientPayments).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: ClientPaymentId): Promise<ClientPayment | null> {
    const row = await this.#db
      .select()
      .from(clientPayments)
      .where(and(eq(clientPayments.id, id), isNull(clientPayments.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByVenta(ventaId: SaleId): Promise<readonly ClientPayment[]> {
    const rows = await this.#db
      .select()
      .from(clientPayments)
      .where(
        and(eq(clientPayments.ventaId, ventaId), isNull(clientPayments.deletedAt)),
      )
      .orderBy(desc(clientPayments.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async sumByVenta(ventaId: SaleId): Promise<Money> {
    const rows = await this.findByVenta(ventaId);
    return rows.length === 0 ? ZERO : sum(rows.map((r) => r.montoCentavos));
  }

  async delete(id: ClientPaymentId): Promise<void> {
    const ts = now();
    await this.#db
      .update(clientPayments)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(clientPayments.id, id))
      .run();
  }

  #mapRow(row: PaymentRow): ClientPayment {
    return {
      id: row.id as ClientPaymentId,
      ventaId: row.ventaId as SaleId,
      fecha: row.fecha as IsoDate,
      montoCentavos: row.montoCentavos,
      metodo: row.metodo as PaymentMethod,
      nota: row.nota,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
