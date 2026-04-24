/**
 * Drizzle-backed implementation of {@link SalesRepository}.
 *
 * Shares one `db` + one `deviceId` per app instance (both wired at
 * composition time). All writes go through `this.#rowFor(...)` so the
 * business-id / device-id / timestamps / deletedAt audit contract from
 * CLAUDE.md §9 stays in one place.
 *
 * Reads run through `this.#mapRow(...)` to project plain-SQL text columns
 * back into their branded-type equivalents — the brand is zero-cost at
 * runtime, so this costs nothing at the call-site and stops `as any` from
 * leaking into the rest of the codebase.
 */

import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type {
  BusinessId,
  ClientId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewSale,
  PaymentState,
  Sale,
  SaleCategory,
  SaleId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { SalesRepository } from '../sales-repository.js';
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
      .where(
        and(eq(sales.fecha, date), eq(sales.businessId, businessId), isNull(sales.deletedAt)),
      )
      .orderBy(desc(sales.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findPendingByClient(clientId: ClientId): Promise<readonly Sale[]> {
    const rows = await this.#db
      .select()
      .from(sales)
      .where(
        and(
          eq(sales.clienteId, clientId),
          inArray(sales.estadoPago, ['pendiente', 'parcial']),
          isNull(sales.deletedAt),
        ),
      )
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async updatePaymentState(id: SaleId, state: PaymentState): Promise<void> {
    await this.#db
      .update(sales)
      .set({ estadoPago: state, updatedAt: now() })
      .where(eq(sales.id, id))
      .run();
  }

  async delete(id: SaleId): Promise<void> {
    const ts = now();
    await this.#db
      .update(sales)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(sales.id, id))
      .run();
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
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
