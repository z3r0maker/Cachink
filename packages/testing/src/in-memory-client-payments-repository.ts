/**
 * In-memory {@link ClientPaymentsRepository}.
 */

import type {
  ClientPayment,
  ClientPaymentId,
  DeviceId,
  IsoTimestamp,
  Money,
  NewClientPayment,
  SaleId,
} from '@cachink/domain';
import { ZERO, newEntityId, now, sum } from '@cachink/domain';
import type { ClientPaymentsRepository } from '@cachink/data';

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
      ventaId: input.ventaId,
      fecha: input.fecha,
      montoCentavos: input.montoCentavos,
      metodo: input.metodo,
      nota: input.nota ?? null,
      businessId: input.businessId,
      deviceId: this.deviceId,
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

  async findByVenta(ventaId: SaleId): Promise<readonly ClientPayment[]> {
    return [...this.rows.values()]
      .filter((r) => r.ventaId === ventaId && r.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async sumByVenta(ventaId: SaleId): Promise<Money> {
    const rows = await this.findByVenta(ventaId);
    return rows.length === 0 ? ZERO : sum(rows.map((r) => r.montoCentavos));
  }

  async delete(id: ClientPaymentId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
