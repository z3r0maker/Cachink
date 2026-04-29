/**
 * In-memory {@link ProductsRepository}.
 */

import type {
  BusinessId,
  DeviceId,
  IsoTimestamp,
  NewProduct,
  Product,
  ProductId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { ProductPatch, ProductsRepository } from '@cachink/data';

export class InMemoryProductsRepository implements ProductsRepository {
  private readonly rows = new Map<ProductId, Product>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewProduct): Promise<Product> {
    const id = newEntityId<ProductId>();
    const ts = now();
    const row: Product = {
      id,
      nombre: input.nombre,
      sku: input.sku ?? null,
      categoria: input.categoria,
      costoUnitCentavos: input.costoUnitCentavos,
      unidad: input.unidad,
      umbralStockBajo: input.umbralStockBajo ?? 3,
      tipo: input.tipo ?? 'producto',
      seguirStock: input.seguirStock ?? true,
      precioVentaCentavos: input.precioVentaCentavos,
      atributos: input.atributos ?? {},
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: ProductId): Promise<Product | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findBySku(sku: string, businessId: BusinessId): Promise<Product | null> {
    return (
      [...this.rows.values()].find(
        (r) => r.sku === sku && r.businessId === businessId && r.deletedAt === null,
      ) ?? null
    );
  }

  async listForBusiness(businessId: BusinessId): Promise<readonly Product[]> {
    return [...this.rows.values()]
      .filter((r) => r.businessId === businessId && r.deletedAt === null)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async update(id: ProductId, patch: ProductPatch): Promise<Product | null> {
    const existing = this.rows.get(id);
    if (!existing || existing.deletedAt !== null) return null;
    const ts: IsoTimestamp = now();
    const next: Product = {
      ...existing,
      nombre: patch.nombre ?? existing.nombre,
      sku: patch.sku ?? existing.sku,
      categoria: patch.categoria ?? existing.categoria,
      unidad: patch.unidad ?? existing.unidad,
      umbralStockBajo: patch.umbralStockBajo ?? existing.umbralStockBajo,
      updatedAt: ts,
    };
    this.rows.set(id, next);
    return next;
  }

  async delete(id: ProductId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }

  async count(businessId: BusinessId): Promise<number> {
    let n = 0;
    for (const r of this.rows.values()) {
      if (r.businessId === businessId && r.deletedAt === null) n++;
    }
    return n;
  }
}
