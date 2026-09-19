/**
 * Drizzle-backed {@link ClientPaymentsRepository}.
 */

import { and, asc, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type {
  BusinessId,
  ClientId,
  ClientPaymentId,
  DeviceId,
  UserId,
  IsoDate,
  IsoTimestamp,
  NewClientPayment,
  PaymentMethod,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type { ClientPayment, ClientPaymentsRepository } from '../client-payments-repository.js';
import { clientPayments } from '../../schema/index.js';
import type { XangarroDatabase } from './_db.js';

type PaymentRow = typeof clientPayments.$inferSelect;

export class DrizzleClientPaymentsRepository implements ClientPaymentsRepository {
  readonly #db: XangarroDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: XangarroDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewClientPayment): Promise<ClientPayment> {
    const id = newEntityId<ClientPaymentId>();
    const ts = now();
    const row = {
      id,
      clienteId: input.clienteId,
      fecha: input.fecha,
      montoCentavos: input.montoCentavos,
      metodo: input.metodo,
      nota: input.nota ?? null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
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

  async findByCliente(clienteId: ClientId): Promise<readonly ClientPayment[]> {
    const rows = await this.#db
      .select()
      .from(clientPayments)
      .where(and(eq(clientPayments.clienteId, clienteId), isNull(clientPayments.deletedAt)))
      .orderBy(asc(clientPayments.fecha), asc(clientPayments.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly ClientPayment[]> {
    const rows = await this.#db
      .select()
      .from(clientPayments)
      .where(
        and(
          gte(clientPayments.fecha, from),
          lte(clientPayments.fecha, to),
          eq(clientPayments.businessId, businessId),
          isNull(clientPayments.deletedAt),
        ),
      )
      .orderBy(desc(clientPayments.fecha), desc(clientPayments.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
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
      clienteId: row.clienteId as ClientId,
      fecha: row.fecha as IsoDate,
      montoCentavos: row.montoCentavos,
      metodo: row.metodo as PaymentMethod,
      nota: row.nota,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
