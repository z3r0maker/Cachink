/**
 * Drizzle-backed ConversionsRepository. Phase 8.
 */
import { and, eq, isNull } from 'drizzle-orm';
import type { BusinessId, Conversion, ConversionId, ConversionRecetaId, DeviceId, InventoryMovementId, IsoTimestamp, ProductId, UserId } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { ConversionsRepository, CreateConversionInput } from '../conversions-repository.js';
import { conversions } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type Row = typeof conversions.$inferSelect;

export class DrizzleConversionsRepository implements ConversionsRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;
  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db; this.#deviceId = deviceId; this.#userId = userId;
  }

  async create(input: CreateConversionInput): Promise<Conversion> {
    const id = newEntityId<ConversionId>(); const ts = now();
    const row = {
      id, recetaId: input.recetaId, materiaPrimaId: input.materiaPrimaId,
      productoResultanteId: input.productoResultanteId,
      cantidadOrigenUsada: input.cantidadOrigenUsada, cantidadResultanteCreada: input.cantidadResultanteCreada,
      movimientoSalidaId: input.movimientoSalidaId, movimientoEntradaId: input.movimientoEntradaId,
      businessId: input.businessId, deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts, updatedAt: ts, deletedAt: null as string | null,
    };
    await this.#db.insert(conversions).values(row).run();
    return this.#map(row as unknown as Row);
  }

  async findById(id: ConversionId): Promise<Conversion | null> {
    const r = await this.#db.select().from(conversions).where(and(eq(conversions.id, id), isNull(conversions.deletedAt))).get();
    return r ? this.#map(r) : null;
  }

  async findByBusiness(businessId: BusinessId): Promise<readonly Conversion[]> {
    const rows = await this.#db.select().from(conversions).where(and(eq(conversions.businessId, businessId), isNull(conversions.deletedAt))).all();
    return rows.map((r) => this.#map(r));
  }

  #map(r: Row): Conversion {
    return {
      id: r.id as ConversionId, recetaId: r.recetaId as ConversionRecetaId,
      materiaPrimaId: r.materiaPrimaId as ProductId, productoResultanteId: r.productoResultanteId as ProductId,
      cantidadOrigenUsada: r.cantidadOrigenUsada, cantidadResultanteCreada: r.cantidadResultanteCreada,
      movimientoSalidaId: r.movimientoSalidaId as InventoryMovementId,
      movimientoEntradaId: r.movimientoEntradaId as InventoryMovementId,
      businessId: r.businessId as BusinessId, deviceId: r.deviceId as DeviceId,
      createdByUserId: (r.createdByUserId ?? null) as UserId | null,
      createdAt: r.createdAt as IsoTimestamp, updatedAt: r.updatedAt as IsoTimestamp,
      deletedAt: (r.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
