/**
 * Drizzle-backed ConversionRecetasRepository. Phase 8.
 */
import { and, eq, isNull } from 'drizzle-orm';
import type {
  BusinessId, ConversionReceta, ConversionRecetaId,
  DeviceId, IsoTimestamp, ProductId, UserId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { ConversionRecetasRepository, CreateConversionRecetaInput } from '../conversion-recetas-repository.js';
import { conversionRecetas } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type Row = typeof conversionRecetas.$inferSelect;

export class DrizzleConversionRecetasRepository implements ConversionRecetasRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: CreateConversionRecetaInput): Promise<ConversionReceta> {
    const id = newEntityId<ConversionRecetaId>();
    const ts = now();
    const row = {
      id, materiaPrimaId: input.materiaPrimaId, productoResultanteId: input.productoResultanteId,
      cantidadOrigen: input.cantidadOrigen, cantidadResultante: input.cantidadResultante,
      businessId: input.businessId, deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts, updatedAt: ts, deletedAt: null as string | null,
    };
    await this.#db.insert(conversionRecetas).values(row).run();
    return this.#map(row as unknown as Row);
  }

  async findById(id: ConversionRecetaId): Promise<ConversionReceta | null> {
    const r = await this.#db.select().from(conversionRecetas).where(and(eq(conversionRecetas.id, id), isNull(conversionRecetas.deletedAt))).get();
    return r ? this.#map(r) : null;
  }

  async findByMateriaPrima(mpId: ProductId): Promise<readonly ConversionReceta[]> {
    const rows = await this.#db.select().from(conversionRecetas)
      .where(and(eq(conversionRecetas.materiaPrimaId, mpId), isNull(conversionRecetas.deletedAt))).all();
    return rows.map((r) => this.#map(r));
  }

  async findByProductoResultante(prodId: ProductId): Promise<ConversionReceta | null> {
    const r = await this.#db.select().from(conversionRecetas)
      .where(and(eq(conversionRecetas.productoResultanteId, prodId), isNull(conversionRecetas.deletedAt))).get();
    return r ? this.#map(r) : null;
  }

  async findAllByBusiness(businessId: BusinessId): Promise<readonly ConversionReceta[]> {
    const rows = await this.#db.select().from(conversionRecetas)
      .where(and(eq(conversionRecetas.businessId, businessId), isNull(conversionRecetas.deletedAt))).all();
    return rows.map((r) => this.#map(r));
  }

  async delete(id: ConversionRecetaId): Promise<void> {
    const ts = now();
    await this.#db.update(conversionRecetas).set({ deletedAt: ts, updatedAt: ts }).where(eq(conversionRecetas.id, id)).run();
  }

  #map(r: Row): ConversionReceta {
    return {
      id: r.id as ConversionRecetaId, materiaPrimaId: r.materiaPrimaId as ProductId,
      productoResultanteId: r.productoResultanteId as ProductId,
      cantidadOrigen: r.cantidadOrigen, cantidadResultante: r.cantidadResultante,
      businessId: r.businessId as BusinessId, deviceId: r.deviceId as DeviceId,
      createdByUserId: (r.createdByUserId ?? null) as UserId | null,
      createdAt: r.createdAt as IsoTimestamp, updatedAt: r.updatedAt as IsoTimestamp,
      deletedAt: (r.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
