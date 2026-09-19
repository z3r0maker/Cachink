/**
 * Drizzle-backed implementation of {@link SalesRepository}.
 *
 * All writes stamp business-id / device-id / timestamps per CLAUDE.md §9.
 * Reads project SQL rows back to branded domain types via `#mapRow`.
 */

import { and, desc, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  UserId,
  NewSale,
  ProductId,
  Sale,
  SaleId,
  TicketId,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type { SalePatch, SalesRepository } from '../sales-repository.js';
import { sales } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';
import { mapSaleRow } from './sales-row-mapper.js';

export class DrizzleSalesRepository implements SalesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewSale): Promise<Sale> {
    const id = newEntityId<SaleId>();
    const ts = now();
    const row = {
      id,
      ticketId: input.ticketId,
      fecha: input.fecha,
      concepto: input.concepto,
      categoria: input.categoria,
      monto: input.monto,
      productoId: input.productoId,
      cantidad: input.cantidad ?? 1,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(sales).values(row).run();
    return mapSaleRow(row);
  }

  async findByTicket(ticketId: TicketId): Promise<readonly Sale[]> {
    const rows = await this.#db
      .select()
      .from(sales)
      .where(and(eq(sales.ticketId, ticketId), isNull(sales.deletedAt)))
      .all();
    return rows.map((r) => mapSaleRow(r));
  }

  async findById(id: SaleId): Promise<Sale | null> {
    const row = await this.#db
      .select()
      .from(sales)
      .where(and(eq(sales.id, id), isNull(sales.deletedAt)))
      .get();
    return row ? mapSaleRow(row) : null;
  }

  async findByDate(date: string, businessId: BusinessId): Promise<readonly Sale[]> {
    const rows = await this.#db
      .select()
      .from(sales)
      .where(and(eq(sales.fecha, date), eq(sales.businessId, businessId), isNull(sales.deletedAt)))
      .orderBy(desc(sales.createdAt))
      .all();
    return rows.map((r) => mapSaleRow(r));
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly Sale[]> {
    const rows = await this.#db
      .select()
      .from(sales)
      .where(
        and(
          gte(sales.fecha, from),
          lte(sales.fecha, to),
          eq(sales.businessId, businessId),
          isNull(sales.deletedAt),
        ),
      )
      .orderBy(desc(sales.fecha), desc(sales.createdAt))
      .all();
    return rows.map((r) => mapSaleRow(r));
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
    await this.#db.update(sales).set(updates).where(eq(sales.id, id)).run();
    return this.findById(id);
  }

  async delete(id: SaleId): Promise<void> {
    const ts = now();
    await this.#db
      .update(sales)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(sales.id, id))
      .run();
  }

  async count(businessId: BusinessId): Promise<number> {
    const result = await this.#db
      .select({ value: sql<number>`count(*)` })
      .from(sales)
      .where(and(eq(sales.businessId, businessId), isNull(sales.deletedAt)))
      .get();
    return result?.value ?? 0;
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
      .where(
        and(
          eq(sales.businessId, opts.businessId),
          isNull(sales.deletedAt),
          gte(sales.fecha, opts.since),
        ),
      )
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
}
