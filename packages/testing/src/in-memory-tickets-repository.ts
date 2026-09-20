/**
 * In-memory {@link TicketsRepository}.
 */

import type {
  BusinessId,
  CajaTurnoId,
  ClientId,
  DeviceId,
  NewTicket,
  Ticket,
  TicketId,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type { TicketsRepository } from '@xangarro/data';

export class InMemoryTicketsRepository implements TicketsRepository {
  private readonly rows = new Map<TicketId, Ticket>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewTicket): Promise<Ticket> {
    const id = newEntityId<TicketId>();
    const ts = now();
    const row: Ticket = {
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
      cancelMotivo: null,
      cancelledByUserId: null,
      cancelledAt: null,
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

  async findById(id: TicketId): Promise<Ticket | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async nextFolio(businessId: BusinessId): Promise<number> {
    const folios = [...this.rows.values()]
      .filter((r) => r.businessId === businessId && r.deviceId === this.deviceId)
      .map((r) => r.folio);
    return (folios.length === 0 ? 0 : Math.max(...folios)) + 1;
  }

  async findByDate(date: string, businessId: BusinessId): Promise<readonly Ticket[]> {
    return [...this.rows.values()]
      .filter((r) => r.fecha === date && r.businessId === businessId && r.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByCajaTurno(cajaTurnoId: CajaTurnoId): Promise<readonly Ticket[]> {
    return [...this.rows.values()]
      .filter((r) => r.cajaTurnoId === cajaTurnoId && r.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly Ticket[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId && r.deletedAt === null && r.fecha >= from && r.fecha <= to,
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.createdAt.localeCompare(a.createdAt));
  }

  async findPendingByClient(clientId: ClientId): Promise<readonly Ticket[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.clienteId === clientId &&
          (r.estadoPago === 'pendiente' || r.estadoPago === 'parcial') &&
          r.deletedAt === null,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async updatePaymentState(id: TicketId, state: Ticket['estadoPago']): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    this.rows.set(id, { ...existing, estadoPago: state, updatedAt: now() });
  }

  async cancel(id: TicketId, motivo: string, cancelledByUserId: string): Promise<Ticket | null> {
    const existing = this.rows.get(id);
    if (!existing || existing.deletedAt !== null || existing.cancelledAt !== null) return null;
    const ts = now();
    const cancelled: Ticket = {
      ...existing,
      cancelMotivo: motivo,
      cancelledByUserId: cancelledByUserId as Ticket['cancelledByUserId'],
      cancelledAt: ts,
      updatedAt: ts,
    };
    this.rows.set(id, cancelled);
    return cancelled;
  }

  async delete(id: TicketId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
