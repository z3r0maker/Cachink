/**
 * In-memory {@link ClientPaymentsRepository}.
 */

import type {
  BusinessId,
  ClientId,
  ClientPayment,
  ClientPaymentId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewClientPayment,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type { ClientPaymentsRepository } from '@xangarro/data';

export class InMemoryClientPaymentsRepository implements ClientPaymentsRepository {
  private readonly rows = new Map<ClientPaymentId, ClientPayment>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewClientPayment): Promise<ClientPayment> {
    const id = newEntityId<ClientPaymentId>();
    const ts = now();
    const row: ClientPayment = {
      id,
      clienteId: input.clienteId,
      fecha: input.fecha,
      montoCentavos: input.montoCentavos,
      metodo: input.metodo,
      nota: input.nota ?? null,
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

  async findById(id: ClientPaymentId): Promise<ClientPayment | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findByCliente(clienteId: ClientId): Promise<readonly ClientPayment[]> {
    return [...this.rows.values()]
      .filter((r) => r.clienteId === clienteId && r.deletedAt === null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly ClientPayment[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId && r.deletedAt === null && r.fecha >= from && r.fecha <= to,
      )
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  async delete(id: ClientPaymentId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
