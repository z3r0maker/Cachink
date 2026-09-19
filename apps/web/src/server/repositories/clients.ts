import 'server-only';

import { and, count as sqlCount, eq, isNull, like } from 'drizzle-orm';
import { clients } from '@xangarro/data-pg';
import type { ClientPatch, ClientsRepository } from '@xangarro/data';
import {
  newUlid,
  type BusinessId,
  type Client,
  type ClientId,
  type NewClient,
} from '@xangarro/domain';

import type { Tx } from '../db';
import { PORTAL_DEVICE_ID } from './portal-device';
import { recordChange } from './sync-log';

/**
 * A Postgres `ClientsRepository`, bound to one tenant transaction — the
 * clients twin of `repositories/products.ts`: no business rule lives here
 * (the use cases validate), tenancy is the transaction's, and every write
 * appends to `sync_log` in the same transaction so phones learn of it (§5).
 *
 * `rfc` is the one column the SQLite half does not carry yet (N-16/C-15
 * split): the phone keeps writing clients without it, and NULL is its value.
 */

const now = (): string => new Date().toISOString();
const iso = (t: string | null): string | null => (t === null ? null : new Date(t).toISOString());

type Row = typeof clients.$inferSelect;

function toDomain(row: Row): Client {
  return {
    ...row,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    deletedAt: iso(row.deletedAt),
  } as unknown as Client;
}

const alive = () => isNull(clients.deletedAt);

function reads(tx: Tx) {
  return {
    async findById(id: ClientId): Promise<Client | null> {
      const [row] = await tx
        .select()
        .from(clients)
        .where(and(alive(), eq(clients.id, id)));
      return row ? toDomain(row) : null;
    },

    async findByName(query: string): Promise<readonly Client[]> {
      const rows = await tx
        .select()
        .from(clients)
        .where(and(alive(), like(clients.nombre, `%${query}%`)))
        .orderBy(clients.nombre);
      return rows.map(toDomain);
    },

    async count(): Promise<number> {
      const [row] = await tx.select({ n: sqlCount() }).from(clients).where(alive());
      return row?.n ?? 0;
    },
  };
}

function creates(tx: Tx, businessId: BusinessId) {
  return {
    async create(input: NewClient): Promise<Client> {
      const stamp = now();
      const [row] = await tx
        .insert(clients)
        .values({
          id: newUlid(),
          nombre: input.nombre,
          telefono: input.telefono ?? null,
          email: input.email ?? null,
          nota: input.nota ?? null,
          rfc: input.rfc ?? null,
          businessId,
          deviceId: PORTAL_DEVICE_ID,
          createdByUserId: null,
          createdAt: stamp,
          updatedAt: stamp,
          deletedAt: null,
        })
        .returning();
      if (!row) throw new Error('client insert returned no row');
      await recordChange(tx, businessId, 'clients', row.id, 'insert');
      return toDomain(row);
    },
  };
}

function writes(tx: Tx, businessId: BusinessId) {
  return {
    async update(id: ClientId, patch: ClientPatch): Promise<Client | null> {
      const set: Partial<Row> = { updatedAt: now() };
      if (patch.nombre !== undefined) set.nombre = patch.nombre;
      if (patch.telefono !== undefined) set.telefono = patch.telefono;
      if (patch.email !== undefined) set.email = patch.email;
      if (patch.nota !== undefined) set.nota = patch.nota;
      if (patch.rfc !== undefined) set.rfc = patch.rfc ?? null;
      const [row] = await tx
        .update(clients)
        .set(set)
        .where(and(alive(), eq(clients.id, id)))
        .returning();
      if (!row) return null;
      await recordChange(tx, businessId, 'clients', id, 'update');
      return toDomain(row);
    },

    async delete(id: ClientId): Promise<void> {
      const stamp = now();
      const [row] = await tx
        .update(clients)
        .set({ deletedAt: stamp, updatedAt: stamp })
        .where(and(alive(), eq(clients.id, id)))
        .returning({ id: clients.id });
      if (row) await recordChange(tx, businessId, 'clients', row.id, 'update');
    },
  };
}

export function pgClientsRepository(tx: Tx, businessId: BusinessId): ClientsRepository {
  return {
    ...reads(tx),
    ...creates(tx, businessId),
    ...writes(tx, businessId),
  };
}
