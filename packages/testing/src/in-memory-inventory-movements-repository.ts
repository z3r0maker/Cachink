/**
 * In-memory {@link InventoryMovementsRepository}.
 */

import type {
  BusinessId,
  DeviceId,
  InventoryMovement,
  InventoryMovementId,
  IsoDate,
  IsoTimestamp,
  NewInventoryMovement,
  ProductId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { InventoryMovementsRepository } from '@cachink/data';

export class InMemoryInventoryMovementsRepository implements InventoryMovementsRepository {
  private readonly rows = new Map<InventoryMovementId, InventoryMovement>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewInventoryMovement): Promise<InventoryMovement> {
    const id = newEntityId<InventoryMovementId>();
    const ts = now();
    const row: InventoryMovement = {
      id,
      productoId: input.productoId,
      fecha: input.fecha,
      tipo: input.tipo,
      cantidad: input.cantidad,
      costoUnitCentavos: input.costoUnitCentavos,
      motivo: input.motivo,
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

  async findById(id: InventoryMovementId): Promise<InventoryMovement | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findByProduct(productoId: ProductId): Promise<readonly InventoryMovement[]> {
    return [...this.rows.values()]
      .filter((r) => r.productoId === productoId && r.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly InventoryMovement[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId &&
          r.deletedAt === null &&
          r.fecha >= from &&
          r.fecha <= to,
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  async sumStock(productoId: ProductId): Promise<number> {
    const rows = await this.findByProduct(productoId);
    let total = 0;
    for (const row of rows) {
      total += row.tipo === 'entrada' ? row.cantidad : -row.cantidad;
    }
    return total;
  }

  async delete(id: InventoryMovementId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
