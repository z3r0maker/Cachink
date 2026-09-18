import 'server-only';

import type { BusinessPatch, BusinessesRepository } from '@xangarro/data';
import { businesses } from '@xangarro/data-pg';
import { parseAtributos, type Business, type BusinessId } from '@xangarro/domain';
import { eq } from 'drizzle-orm';

import type { Tx } from '../db';
import { recordChange } from './sync-log';

/**
 * `BusinessesRepository` over Postgres, inside a tenant transaction (P-15).
 *
 * `businesses` is a DOWN table: every update here is logged for the phones in
 * the same transaction, which is how a switched flag reaches them. Creating
 * and deleting a business are not portal operations (sign-up is P-03, B-10).
 */
const iso = (t: string | null): string | null => (t === null ? null : new Date(t).toISOString());

function toDomain(row: typeof businesses.$inferSelect): Business {
  return {
    ...row,
    atributosProducto: parseAtributos(row.atributosProducto),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    deletedAt: iso(row.deletedAt),
  } as unknown as Business;
}

export function pgBusinessesRepository(tx: Tx, businessId: string): BusinessesRepository {
  const findById = async (id: BusinessId): Promise<Business | null> => {
    const [row] = await tx.select().from(businesses).where(eq(businesses.id, id));
    return row ? toDomain(row) : null;
  };
  return {
    findById,
    findCurrent: findById,
    async update(id: BusinessId, patch: BusinessPatch): Promise<Business> {
      const { atributosProducto, ...rest } = patch;
      const atributos =
        atributosProducto === undefined
          ? {}
          : { atributosProducto: JSON.stringify(atributosProducto) };
      const [row] = await tx
        .update(businesses)
        .set({ ...rest, ...atributos, updatedAt: new Date().toISOString() })
        .where(eq(businesses.id, id))
        .returning();
      if (!row) throw new Error(`business ${id} not found`);
      await recordChange(tx, businessId, 'businesses', row.id, 'update');
      return toDomain(row);
    },
    create: () => Promise.reject(new Error('Businesses are created at sign-up, not here.')),
    delete: () => Promise.reject(new Error('Businesses are not deleted from the portal.')),
  };
}
