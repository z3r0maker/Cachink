import 'server-only';

import { and, eq, isNull, count as sqlCount } from 'drizzle-orm';
import { products } from '@xangarro/data-pg';
import type { ProductPatch, ProductsRepository } from '@xangarro/data';
import type { BusinessId, Product, ProductId } from '@xangarro/domain';

import type { Tx } from '../db';
import { recordChange } from './sync-log';

/**
 * A Postgres `ProductsRepository`, bound to one tenant transaction.
 *
 * The point of this file is that **no business rule lives in it**.
 * `EditarProductoUseCase` already re-validates the patch, refuses a missing
 * row, and forbids retroactive cost edits; reimplementing any of that here
 * would be the duplication CLAUDE.md §2.3 exists to prevent. The phone runs the
 * same use case over the SQLite implementation of this same interface.
 *
 * Two things are specific to the cloud side, and both are structural:
 *
 * 1. **Tenancy is the transaction's, not a parameter's.** `withTenant` sets the
 *    claim for the transaction, so RLS already scopes every statement. The
 *    `businessId` arguments the interface carries are the device's idiom; here
 *    they are redundant, and deliberately not used to filter — trusting a
 *    caller-supplied id over the policy is how cross-tenant reads happen.
 *
 * 2. **Every write appends to `sync_log`.** That is how devices learn the row
 *    changed (contract §5). The append shares this transaction, so a row can
 *    never be updated without the device-visible record of it, nor recorded as
 *    changed when the update rolled back.
 */

const now = (): string => new Date().toISOString();
const iso = (t: string | null): string | null => (t === null ? null : new Date(t).toISOString());

/**
 * A pg row in the shape the domain entities are written against.
 *
 * Two conversions the read path never needed and so never did: `atributos` is a
 * JSON string on disk for device parity, and Postgres renders `timestamptz` as
 * `2026-01-02 15:00:00+00` — a valid timestamp, but not the ISO 8601 the
 * domain's `isoTimestampField` requires. A write validates through
 * `ProductSchema`, so both surfaced immediately.
 */
function toDomain(row: typeof products.$inferSelect): Product {
  return {
    ...row,
    atributos: JSON.parse(row.atributos) as Record<string, string>,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    deletedAt: iso(row.deletedAt),
  } as unknown as Product;
}

const alive = (extra?: ReturnType<typeof eq>) =>
  extra ? and(extra, isNull(products.deletedAt)) : isNull(products.deletedAt);

function reads(tx: Tx) {
  return {
    async findById(id: ProductId): Promise<Product | null> {
      const [row] = await tx
        .select()
        .from(products)
        .where(alive(eq(products.id, id)));
      return row ? toDomain(row) : null;
    },
    async findBySku(sku: string): Promise<Product | null> {
      const [row] = await tx
        .select()
        .from(products)
        .where(alive(eq(products.sku, sku)));
      return row ? toDomain(row) : null;
    },
    async listForBusiness(): Promise<readonly Product[]> {
      const rows = await tx.select().from(products).where(alive());
      return rows.map(toDomain);
    },
    async count(): Promise<number> {
      const [row] = await tx.select({ n: sqlCount() }).from(products).where(alive());
      return row?.n ?? 0;
    },
  };
}

function writes(tx: Tx, businessId: BusinessId) {
  return {
    async update(id: ProductId, patch: ProductPatch): Promise<Product | null> {
      const [row] = await tx
        .update(products)
        .set({ ...patch, updatedAt: now() })
        .where(alive(eq(products.id, id)))
        .returning();
      if (!row) return null;

      // Same transaction as the update, deliberately: a row must never change
      // without the record the device pulls, nor be announced as changed when
      // the update rolled back.
      await recordChange(tx, businessId, 'products', id, 'update');
      return toDomain(row);
    },
  };
}

/**
 * `products` is a HYBRID table: devices insert, the portal edits, and the edit
 * flows back down (contract §8, ADR-058 §2). A product is born at the counter
 * mid-sale, so creating or deleting one here would invent a change the device
 * never agreed to. `isPushable('products', 'update')` is false for the same
 * reason, read from the other direction.
 */
const deviceOnly = (verb: string) => (): never => {
  throw new TypeError(`Los productos se ${verb} en el dispositivo, no en el portal.`);
};

export function pgProductsRepository(tx: Tx, businessId: BusinessId): ProductsRepository {
  return {
    ...reads(tx),
    ...writes(tx, businessId),
    create: deviceOnly('crean'),
    delete: deviceOnly('eliminan'),
  };
}
