/**
 * In-memory EntregasCreditoRepository. Phase 11.
 */
import type { BusinessId, ClientId, DeviceId, EntregaCredito, EntregaCreditoId, IsoDate } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CreateEntregaCreditoInput, EntregasCreditoRepository } from '@cachink/data';

export class InMemoryEntregasCreditoRepository implements EntregasCreditoRepository {
  private readonly rows = new Map<EntregaCreditoId, EntregaCredito>();
  private readonly deviceId: DeviceId;
  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) { this.deviceId = deviceId; }

  async create(input: CreateEntregaCreditoInput): Promise<EntregaCredito> {
    const id = newEntityId<EntregaCreditoId>(); const ts = now();
    const row: EntregaCredito = {
      id, clienteId: input.clienteId, fecha: input.fecha as IsoDate,
      totalCentavos: input.totalCentavos, nota: input.nota, saleIds: input.saleIds,
      businessId: input.businessId, deviceId: this.deviceId,
      createdByUserId: null, createdAt: ts, updatedAt: ts, deletedAt: null,
    };
    this.rows.set(id, row); return row;
  }
  async findById(id: EntregaCreditoId): Promise<EntregaCredito | null> {
    const r = this.rows.get(id); return r && !r.deletedAt ? r : null;
  }
  async findByClient(clientId: ClientId): Promise<readonly EntregaCredito[]> {
    return [...this.rows.values()].filter((r) => r.clienteId === clientId && !r.deletedAt);
  }
  async findByBusiness(businessId: BusinessId): Promise<readonly EntregaCredito[]> {
    return [...this.rows.values()].filter((r) => r.businessId === businessId && !r.deletedAt);
  }
}
