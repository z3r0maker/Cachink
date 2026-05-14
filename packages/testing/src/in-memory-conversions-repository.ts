/**
 * In-memory ConversionsRepository. Phase 8.
 */
import type { BusinessId, Conversion, ConversionId, ConversionRecetaId, DeviceId, InventoryMovementId, ProductId } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { ConversionsRepository, CreateConversionInput } from '@cachink/data';

export class InMemoryConversionsRepository implements ConversionsRepository {
  private readonly rows = new Map<ConversionId, Conversion>();
  private readonly deviceId: DeviceId;
  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) { this.deviceId = deviceId; }

  async create(input: CreateConversionInput): Promise<Conversion> {
    const id = newEntityId<ConversionId>(); const ts = now();
    const row: Conversion = {
      id, recetaId: input.recetaId as ConversionRecetaId,
      materiaPrimaId: input.materiaPrimaId as ProductId,
      productoResultanteId: input.productoResultanteId as ProductId,
      cantidadOrigenUsada: input.cantidadOrigenUsada,
      cantidadResultanteCreada: input.cantidadResultanteCreada,
      movimientoSalidaId: input.movimientoSalidaId as InventoryMovementId,
      movimientoEntradaId: input.movimientoEntradaId as InventoryMovementId,
      businessId: input.businessId, deviceId: this.deviceId,
      createdByUserId: null, createdAt: ts, updatedAt: ts, deletedAt: null,
    };
    this.rows.set(id, row); return row;
  }
  async findById(id: ConversionId): Promise<Conversion | null> {
    const r = this.rows.get(id); return r && !r.deletedAt ? r : null;
  }
  async findByBusiness(businessId: BusinessId): Promise<readonly Conversion[]> {
    return [...this.rows.values()].filter((r) => r.businessId === businessId && !r.deletedAt);
  }
}
