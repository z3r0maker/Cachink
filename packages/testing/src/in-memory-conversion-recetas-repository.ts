/**
 * In-memory ConversionRecetasRepository. Phase 8.
 */
import type { BusinessId, ConversionReceta, ConversionRecetaId, DeviceId, ProductId } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { ConversionRecetasRepository, CreateConversionRecetaInput } from '@cachink/data';
import type { IsoTimestamp } from '@cachink/domain';

export class InMemoryConversionRecetasRepository implements ConversionRecetasRepository {
  private readonly rows = new Map<ConversionRecetaId, ConversionReceta>();
  private readonly deviceId: DeviceId;
  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) { this.deviceId = deviceId; }

  async create(input: CreateConversionRecetaInput): Promise<ConversionReceta> {
    const id = newEntityId<ConversionRecetaId>(); const ts = now();
    const row: ConversionReceta = {
      id, materiaPrimaId: input.materiaPrimaId, productoResultanteId: input.productoResultanteId,
      cantidadOrigen: input.cantidadOrigen, cantidadResultante: input.cantidadResultante,
      businessId: input.businessId, deviceId: this.deviceId, createdByUserId: null,
      createdAt: ts, updatedAt: ts, deletedAt: null,
    };
    this.rows.set(id, row); return row;
  }

  async findById(id: ConversionRecetaId): Promise<ConversionReceta | null> {
    const r = this.rows.get(id); return r && !r.deletedAt ? r : null;
  }
  async findByMateriaPrima(mpId: ProductId): Promise<readonly ConversionReceta[]> {
    return [...this.rows.values()].filter((r) => r.materiaPrimaId === mpId && !r.deletedAt);
  }
  async findByProductoResultante(prodId: ProductId): Promise<ConversionReceta | null> {
    return [...this.rows.values()].find((r) => r.productoResultanteId === prodId && !r.deletedAt) ?? null;
  }
  async findAllByBusiness(businessId: BusinessId): Promise<readonly ConversionReceta[]> {
    return [...this.rows.values()].filter((r) => r.businessId === businessId && !r.deletedAt);
  }
  async delete(id: ConversionRecetaId): Promise<void> {
    const r = this.rows.get(id); if (!r) return;
    this.rows.set(id, { ...r, deletedAt: now() as IsoTimestamp, updatedAt: now() as IsoTimestamp });
  }
}
