/**
 * Drizzle-backed {@link BusinessesRepository}. Follows the same audit +
 * mapping pattern as DrizzleSalesRepository.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type {
  AttrDef,
  BusinessId,
  DeviceId,
  IsoTimestamp,
  SaleCategory,
  TipoNegocio,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type {
  Business,
  BusinessesRepository,
  NewBusiness,
} from '../businesses-repository.js';
import { businesses } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type BusinessRow = typeof businesses.$inferSelect;

export class DrizzleBusinessesRepository implements BusinessesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewBusiness): Promise<Business> {
    const id = newEntityId<BusinessId>();
    const ts = now();
    const row = {
      id,
      nombre: input.nombre,
      regimenFiscal: input.regimenFiscal,
      isrTasa: input.isrTasa,
      logoUrl: input.logoUrl ?? null,
      tipoNegocio: input.tipoNegocio ?? 'mixto',
      categoriaVentaPredeterminada: input.categoriaVentaPredeterminada ?? 'Producto',
      atributosProducto: JSON.stringify(input.atributosProducto ?? []),
      businessId: id,
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(businesses).values(row).run();
    return this.#mapRow(row as unknown as BusinessRow);
  }

  async findById(id: BusinessId): Promise<Business | null> {
    const row = await this.#db
      .select()
      .from(businesses)
      .where(and(eq(businesses.id, id), isNull(businesses.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findCurrent(id: BusinessId): Promise<Business | null> {
    return this.findById(id);
  }

  async delete(id: BusinessId): Promise<void> {
    const ts = now();
    await this.#db
      .update(businesses)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(businesses.id, id))
      .run();
  }

  #mapRow(row: BusinessRow): Business {
    return {
      id: row.id as BusinessId,
      nombre: row.nombre,
      regimenFiscal: row.regimenFiscal,
      isrTasa: row.isrTasa,
      logoUrl: row.logoUrl,
      tipoNegocio: (row.tipoNegocio ?? 'mixto') as TipoNegocio,
      categoriaVentaPredeterminada: (row.categoriaVentaPredeterminada ?? 'Producto') as SaleCategory,
      atributosProducto: this.#parseAttrDefs(row.atributosProducto),
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }

  #parseAttrDefs(raw: string): AttrDef[] {
    try {
      return JSON.parse(raw) as AttrDef[];
    } catch {
      return [];
    }
  }
}
