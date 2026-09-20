/**
 * Drizzle-backed {@link TicketsRepository} — the sale header (ADR-073).
 */

import { and, asc, desc, eq, gte, inArray, isNull, lte, max } from 'drizzle-orm';
import type {
  BusinessId,
  CajaTurnoId,
  ClientId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewTicket,
  PaymentState,
  Ticket,
  TicketId,
  UserId,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type { TicketsRepository } from '../tickets-repository.js';
import { tickets } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type TicketRow = typeof tickets.$inferSelect;

export class DrizzleTicketsRepository implements TicketsRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewTicket): Promise<Ticket> {
    const id = newEntityId<TicketId>();
    const ts = now();
    const row = {
      id,
      folio: input.folio,
      fecha: input.fecha,
      hora: input.hora ?? null,
      concepto: input.concepto,
      metodo: input.metodo,
      clienteId: input.clienteId ?? null,
      estadoPago: input.estadoPago,
      efectivoRecibidoCentavos: input.efectivoRecibidoCentavos ?? null,
      cambioCentavos: input.cambioCentavos ?? null,
      cajaTurnoId: input.cajaTurnoId ?? null,
      cancelMotivo: null as string | null,
      cancelledByUserId: null as string | null,
      cancelledAt: null as string | null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(tickets).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: TicketId): Promise<Ticket | null> {
    const row = await this.#db
      .select()
      .from(tickets)
      .where(and(eq(tickets.id, id), isNull(tickets.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async nextFolio(businessId: BusinessId): Promise<number> {
    const row = await this.#db
      .select({ folio: max(tickets.folio) })
      .from(tickets)
      .where(and(eq(tickets.businessId, businessId), eq(tickets.deviceId, this.#deviceId)))
      .get();
    return (row?.folio ?? 0) + 1;
  }

  async findByDate(date: string, businessId: BusinessId): Promise<readonly Ticket[]> {
    const rows = await this.#db
      .select()
      .from(tickets)
      .where(
        and(eq(tickets.fecha, date), eq(tickets.businessId, businessId), isNull(tickets.deletedAt)),
      )
      .orderBy(desc(tickets.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByCajaTurno(cajaTurnoId: CajaTurnoId): Promise<readonly Ticket[]> {
    const rows = await this.#db
      .select()
      .from(tickets)
      .where(and(eq(tickets.cajaTurnoId, cajaTurnoId), isNull(tickets.deletedAt)))
      .orderBy(desc(tickets.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly Ticket[]> {
    const rows = await this.#db
      .select()
      .from(tickets)
      .where(
        and(
          gte(tickets.fecha, from),
          lte(tickets.fecha, to),
          eq(tickets.businessId, businessId),
          isNull(tickets.deletedAt),
        ),
      )
      .orderBy(desc(tickets.fecha), desc(tickets.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findPendingByClient(clientId: ClientId): Promise<readonly Ticket[]> {
    const rows = await this.#db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.clienteId, clientId),
          inArray(tickets.estadoPago, ['pendiente', 'parcial']),
          isNull(tickets.deletedAt),
        ),
      )
      .orderBy(asc(tickets.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async updatePaymentState(id: TicketId, state: PaymentState): Promise<void> {
    await this.#db
      .update(tickets)
      .set({ estadoPago: state, updatedAt: now() })
      .where(eq(tickets.id, id))
      .run();
  }

  async cancel(id: TicketId, motivo: string, cancelledByUserId: string): Promise<Ticket | null> {
    const ts = now();
    const row = await this.#db
      .update(tickets)
      .set({
        cancelMotivo: motivo,
        cancelledByUserId,
        cancelledAt: ts,
        updatedAt: ts,
      })
      .where(and(eq(tickets.id, id), isNull(tickets.cancelledAt)))
      .returning()
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async delete(id: TicketId): Promise<void> {
    const ts = now();
    await this.#db
      .update(tickets)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(tickets.id, id))
      .run();
  }

  #mapRow(row: TicketRow): Ticket {
    return {
      id: row.id as TicketId,
      folio: row.folio,
      fecha: row.fecha as IsoDate,
      hora: row.hora ?? null,
      concepto: row.concepto,
      metodo: row.metodo,
      clienteId: row.clienteId as ClientId | null,
      estadoPago: row.estadoPago,
      efectivoRecibidoCentavos: row.efectivoRecibidoCentavos,
      cambioCentavos: row.cambioCentavos,
      cajaTurnoId: row.cajaTurnoId as Ticket['cajaTurnoId'],
      cancelMotivo: row.cancelMotivo ?? null,
      cancelledByUserId: row.cancelledByUserId as UserId | null,
      cancelledAt: (row.cancelledAt ?? null) as Ticket['cancelledAt'],
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
