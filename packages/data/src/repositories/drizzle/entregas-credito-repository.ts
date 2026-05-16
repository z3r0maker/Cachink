/**
 * Drizzle-backed EntregasCreditoRepository. Phase 11.
 */
import { and, eq, isNull } from 'drizzle-orm';
import type { BusinessId, ClientId, DeviceId, EntregaCredito, EntregaCreditoId, IsoDate, IsoTimestamp, UserId } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CreateEntregaCreditoInput, EntregasCreditoRepository } from '../entregas-credito-repository.js';
import { entregasCredito } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type Row = typeof entregasCredito.$inferSelect;

export class DrizzleEntregasCreditoRepository implements EntregasCreditoRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;
  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db; this.#deviceId = deviceId; this.#userId = userId;
  }

  async create(input: CreateEntregaCreditoInput): Promise<EntregaCredito> {
    const id = newEntityId<EntregaCreditoId>(); const ts = now();
    const row = {
      id, clienteId: input.clienteId, fecha: input.fecha,
      totalCentavos: input.totalCentavos, nota: input.nota, saleIds: input.saleIds,
      businessId: input.businessId, deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts, updatedAt: ts, deletedAt: null as string | null,
    };
    await this.#db.insert(entregasCredito).values(row).run();
    return this.#map(row as unknown as Row);
  }

  async findById(id: EntregaCreditoId): Promise<EntregaCredito | null> {
    const r = await this.#db.select().from(entregasCredito).where(and(eq(entregasCredito.id, id), isNull(entregasCredito.deletedAt))).get();
    return r ? this.#map(r) : null;
  }
  async findByClient(clientId: ClientId): Promise<readonly EntregaCredito[]> {
    const rows = await this.#db.select().from(entregasCredito).where(and(eq(entregasCredito.clienteId, clientId), isNull(entregasCredito.deletedAt))).all();
    return rows.map((r) => this.#map(r));
  }
  async findByBusiness(businessId: BusinessId): Promise<readonly EntregaCredito[]> {
    const rows = await this.#db.select().from(entregasCredito).where(and(eq(entregasCredito.businessId, businessId), isNull(entregasCredito.deletedAt))).all();
    return rows.map((r) => this.#map(r));
  }

  #map(r: Row): EntregaCredito {
    return {
      id: r.id as EntregaCreditoId, clienteId: r.clienteId as ClientId,
      fecha: r.fecha as IsoDate, totalCentavos: r.totalCentavos,
      nota: r.nota ?? null, saleIds: r.saleIds,
      businessId: r.businessId as BusinessId, deviceId: r.deviceId as DeviceId,
      createdByUserId: (r.createdByUserId ?? null) as UserId | null,
      createdAt: r.createdAt as IsoTimestamp, updatedAt: r.updatedAt as IsoTimestamp,
      deletedAt: (r.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
