/**
 * Drizzle-backed {@link ProductsRepository}.
 */

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  UserId,
  InventoryCategory,
  InventoryUnit,
  IsoTimestamp,
  NewProduct,
  ProductColor,
  ProductIcon,
  UsoProducto,
  ProductId,
  ProductoTipo,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { Product, ProductPatch, ProductsRepository } from '../products-repository.js';
import { products } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type ProductRow = typeof products.$inferSelect;

export class DrizzleProductsRepository implements ProductsRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewProduct): Promise<Product> {
    const id = newEntityId<ProductId>();
    const ts = now();
    const row = {
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
      atributos: JSON.stringify(input.atributos ?? {}),
      colorFondo: input.colorFondo ?? 'white',
      usoProducto: input.usoProducto ?? 'venta',
      icono: input.icono ?? null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(products).values(row).run();
    return this.#mapRow(row as unknown as ProductRow);
  }

  async findById(id: ProductId): Promise<Product | null> {
    const row = await this.#db
      .select()
      .from(products)
      .where(and(eq(products.id, id), isNull(products.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findBySku(sku: string, businessId: BusinessId): Promise<Product | null> {
    const row = await this.#db
      .select()
      .from(products)
      .where(
        and(eq(products.sku, sku), eq(products.businessId, businessId), isNull(products.deletedAt)),
      )
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async listForBusiness(businessId: BusinessId): Promise<readonly Product[]> {
    const rows = await this.#db
      .select()
      .from(products)
      .where(and(eq(products.businessId, businessId), isNull(products.deletedAt)))
      .orderBy(asc(products.nombre))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async update(id: ProductId, patch: ProductPatch): Promise<Product | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const ts = now();
    const updates: Record<string, unknown> = { updatedAt: ts };
    if (patch.nombre !== undefined) updates.nombre = patch.nombre;
    if (patch.sku !== undefined) updates.sku = patch.sku;
    if (patch.categoria !== undefined) updates.categoria = patch.categoria;
    if (patch.unidad !== undefined) updates.unidad = patch.unidad;
    if (patch.umbralStockBajo !== undefined) updates.umbralStockBajo = patch.umbralStockBajo;
    if (patch.colorFondo !== undefined) updates.colorFondo = patch.colorFondo;
    if (patch.usoProducto !== undefined) updates.usoProducto = patch.usoProducto;
    if (patch.icono !== undefined) updates.icono = patch.icono;
    if (patch.costoUnitCentavos !== undefined) updates.costoUnitCentavos = patch.costoUnitCentavos;
    if (patch.precioVentaCentavos !== undefined) updates.precioVentaCentavos = patch.precioVentaCentavos;
    await this.#db.update(products).set(updates).where(eq(products.id, id)).run();
    return this.findById(id);
  }

  async delete(id: ProductId): Promise<void> {
    const ts = now();
    await this.#db
      .update(products)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(products.id, id))
      .run();
  }

  async count(businessId: BusinessId): Promise<number> {
    const result = await this.#db
      .select({ value: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.businessId, businessId), isNull(products.deletedAt)))
      .get();
    return result?.value ?? 0;
  }

  #mapRow(row: ProductRow): Product {
    return {
      id: row.id as ProductId,
      nombre: row.nombre,
      sku: row.sku,
      categoria: row.categoria as InventoryCategory,
      costoUnitCentavos: row.costoUnitCentavos,
      unidad: row.unidad as InventoryUnit,
      umbralStockBajo: row.umbralStockBajo,
      tipo: (row.tipo ?? 'producto') as ProductoTipo,
      seguirStock: row.seguirStock ?? true,
      precioVentaCentavos: row.precioVentaCentavos,
      atributos: this.#parseAtributos(row.atributos),
      colorFondo: (row.colorFondo ?? 'white') as ProductColor,
      usoProducto: (row.usoProducto ?? 'venta') as UsoProducto,
      icono: (row.icono ?? null) as ProductIcon | null,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }

  #parseAtributos(raw: string): Record<string, string> {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return {};
    }
  }
}
