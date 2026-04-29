/**
 * Drizzle-backed implementation of {@link SalesRepository}.
 *
 * All writes stamp business-id / device-id / timestamps per CLAUDE.md §9.
 * Reads project SQL rows back to branded domain types via `#mapRow`.
 */

import { and, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';
import type {
  BusinessId,
  ClientId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewSale,
  PaymentState,
  ProductId,
  Sale,
  SaleCategory,
  SaleId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { SalePatch, SalesRepository } from '../sales-repository.js';
import { sales } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type SaleRow = typeof sales.$inferSelect;

export class DrizzleSalesRepository implements SalesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewSale): Promise<Sale> {
    const id = newEntityId<SaleId>();
    const ts = now();
    const estadoPago: PaymentState = input.metodo === 'Crédito' ? 'pendiente' : 'pagado';
    const row = {
      id,
      fecha: input.fecha,
      concepto: input.concepto,
      categoria: input.categoria,
      monto: input.monto,
      metodo: input.metodo,
      clienteId: input.clienteId ?? null,
      estadoPago,
      productoId: input.productoId,
      cantidad: input.cantidad ?? 1,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(sales).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: SaleId): Promise<Sale | null> {
    const row = await this.#db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), isNull(sales.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByDate(date: string, businessId: BusinessId): Promise<readonly Sale[]> {
    const rows = await this.#db
      .select()
      .from(sales)
      .where(and(eq(sales.fecha, date), eq(sales.businessId, businessId), isNull(sales.deletedAt)))
      .orderBy(desc(sales.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByDateRange(from: string, to: string, businessId: BusinessId): Promise<readonly Sale[]> {
    const rows = await this.#db
      .select()
      .from(sales)
      .where(and(gte(sales.fecha, from), lte(sales.fecha, to), eq(sales.businessId, businessId), isNull(sales.deletedAt)))
      .orderBy(desc(sales.fecha), desc(sales.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findPendingByClient(clientId: ClientId): Promise<readonly Sale[]> {
    const rows = await this.#db
      .select()
      .from(sales)
      .where(and(eq(sales.clienteId, clientId), inArray(sales.estadoPago, ['pendiente', 'parcial']), isNull(sales.deletedAt)))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async updatePaymentState(id: SaleId, state: PaymentState): Promise<void> {
    await this.#db.update(sales).set({ estadoPago: state, updatedAt: now() }).where(eq(sales.id, id)).run();
  }

  async update(id: SaleId, patch: SalePatch): Promise<Sale | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const ts = now();
    const updates: Record<string, unknown> = { updatedAt: ts };
    if (patch.fecha !== undefined) updates.fecha = patch.fecha;
    if (patch.concepto !== undefined) updates.concepto = patch.concepto;
    if (patch.categoria !== undefined) updates.categoria = patch.categoria;
    if (patch.monto !== undefined) updates.monto = patch.monto;
    if (patch.metodo !== undefined) updates.metodo = patch.metodo;
    if (patch.clienteId !== undefined) updates.clienteId = patch.clienteId;
    await this.#db.update(sales).set(updates).where(eq(sales.id, id)).run();
    return this.findById(id);
  }

  async delete(id: SaleId): Promise<void> {
    const ts = now();
    await this.#db.update(sales).set({ deletedAt: ts, updatedAt: ts }).where(eq(sales.id, id)).run();
  }

  async count(businessId: BusinessId): Promise<number> {
    const rows = await this.#db
      .select({ id: sales.id })
      .from(sales)
      .where(and(eq(sales.businessId, businessId), isNull(sales.deletedAt)))
      .all();
    return rows.length;
  }

  async findFrequentProductoIds(opts: {
    businessId: BusinessId;
    since: string;
    limit: number;
  }): Promise<readonly { productoId: ProductId; veces: number; ultimaVenta: string }[]> {
    const rows = await this.#db
      .select({
        productoId: sales.productoId,
        veces: sql<number>`sum(${sales.cantidad})`.as('veces'),
        ultimaVenta: sql<string>`max(${sales.fecha})`.as('ultima_venta'),
      })
      .from(sales)
      .where(and(
        eq(sales.businessId, opts.businessId),
        isNull(sales.deletedAt),
        gte(sales.fecha, opts.since),
      ))
      .groupBy(sales.productoId)
      .orderBy(sql`veces DESC`)
      .limit(opts.limit)
      .all();
    return rows.map((r) => ({
      productoId: r.productoId as ProductId,
      veces: Number(r.veces),
      ultimaVenta: r.ultimaVenta,
    }));
  }

  #mapRow(row: SaleRow): Sale {
    return {
      id: row.id as SaleId,
      fecha: row.fecha as IsoDate,
      concepto: row.concepto,
      categoria: row.categoria as SaleCategory,
      monto: row.monto,
      metodo: row.metodo,
      clienteId: (row.clienteId ?? null) as ClientId | null,
      estadoPago: row.estadoPago,
      productoId: row.productoId as ProductId,
      cantidad: row.cantidad,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
