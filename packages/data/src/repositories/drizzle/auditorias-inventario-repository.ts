/**
 * Drizzle-backed AuditoriasInventarioRepository. Phase 10.
 */
import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type { AuditoriaEstado, AuditoriaInventario, AuditoriaInventarioId, BusinessId, DeviceId, IsoDate, IsoTimestamp, UserId } from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { AuditoriaPatch, AuditoriasInventarioRepository, CreateAuditoriaInput } from '../auditorias-inventario-repository.js';
import { auditoriasInventario } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type Row = typeof auditoriasInventario.$inferSelect;

export class DrizzleAuditoriasInventarioRepository implements AuditoriasInventarioRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;
  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db; this.#deviceId = deviceId; this.#userId = userId;
  }

  async create(input: CreateAuditoriaInput): Promise<AuditoriaInventario> {
    const id = newEntityId<AuditoriaInventarioId>(); const ts = now();
    const row = {
      id, fecha: input.fecha, estado: 'borrador' as const, lineas: input.lineas,
      totalDiscrepancias: 0, totalProductos: input.totalProductos, productosContados: 0,
      businessId: input.businessId, deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts, updatedAt: ts, deletedAt: null as string | null,
    };
    await this.#db.insert(auditoriasInventario).values(row).run();
    return this.#map(row as unknown as Row);
  }

  async findById(id: AuditoriaInventarioId): Promise<AuditoriaInventario | null> {
    const r = await this.#db.select().from(auditoriasInventario).where(and(eq(auditoriasInventario.id, id), isNull(auditoriasInventario.deletedAt))).get();
    return r ? this.#map(r) : null;
  }

  async findLatest(businessId: BusinessId): Promise<AuditoriaInventario | null> {
    const r = await this.#db.select().from(auditoriasInventario)
      .where(and(eq(auditoriasInventario.businessId, businessId), isNull(auditoriasInventario.deletedAt)))
      .orderBy(desc(auditoriasInventario.createdAt)).limit(1).get();
    return r ? this.#map(r) : null;
  }

  async findByDateRange(from: string, to: string, businessId: BusinessId): Promise<readonly AuditoriaInventario[]> {
    const rows = await this.#db.select().from(auditoriasInventario)
      .where(and(eq(auditoriasInventario.businessId, businessId), gte(auditoriasInventario.fecha, from), lte(auditoriasInventario.fecha, to), isNull(auditoriasInventario.deletedAt)))
      .orderBy(desc(auditoriasInventario.createdAt)).all();
    return rows.map((r) => this.#map(r));
  }

  async update(id: AuditoriaInventarioId, patch: AuditoriaPatch): Promise<AuditoriaInventario> {
    const ts = now();
    const set: Record<string, unknown> = { updatedAt: ts };
    if (patch.estado !== undefined) set['estado'] = patch.estado;
    if (patch.lineas !== undefined) set['lineas'] = patch.lineas;
    if (patch.totalDiscrepancias !== undefined) set['totalDiscrepancias'] = patch.totalDiscrepancias;
    if (patch.productosContados !== undefined) set['productosContados'] = patch.productosContados;
    await this.#db.update(auditoriasInventario).set(set).where(eq(auditoriasInventario.id, id)).run();
    const r = await this.#db.select().from(auditoriasInventario).where(eq(auditoriasInventario.id, id)).get();
    if (!r) throw new Error(`Auditoria ${id} not found`);
    return this.#map(r);
  }

  #map(r: Row): AuditoriaInventario {
    return {
      id: r.id as AuditoriaInventarioId, fecha: r.fecha as IsoDate,
      estado: r.estado as AuditoriaEstado, lineas: r.lineas,
      totalDiscrepancias: r.totalDiscrepancias, totalProductos: r.totalProductos,
      productosContados: r.productosContados,
      businessId: r.businessId as BusinessId, deviceId: r.deviceId as DeviceId,
      createdByUserId: (r.createdByUserId ?? null) as UserId | null,
      createdAt: r.createdAt as IsoTimestamp, updatedAt: r.updatedAt as IsoTimestamp,
      deletedAt: (r.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
