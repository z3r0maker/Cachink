import 'server-only';

import { and, eq } from 'drizzle-orm';
import { users } from '@xangarro/data-pg';
import {
  newUlid,
  OperatorNotFoundError,
  type BusinessId,
  type User,
  type UserId,
} from '@xangarro/domain';
import type { CreateUserInput, UserPatch, UsersRepository } from '@xangarro/data';

import type { Tx } from '../db';
import { PORTAL_DEVICE_ID } from './portal-device';
import { recordChange } from './sync-log';

/**
 * A Postgres `UsersRepository`, bound to one tenant transaction.
 *
 * As with products (ADR-062), no business rule lives here — the operator
 * allowance, PIN format and name uniqueness are in the application use cases.
 * Two cloud-side facts do: RLS scopes every statement, so the interface's
 * `businessId` is never used as a filter; and every write appends to
 * `sync_log`, because `users` is a DOWN table every phone pulls.
 */

const iso = (t: string | null): string | null => (t === null ? null : new Date(t).toISOString());

function toDomain(row: typeof users.$inferSelect): User {
  return {
    ...row,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    deletedAt: iso(row.deletedAt),
  } as unknown as User;
}

function reads(tx: Tx) {
  return {
    async findById(id: UserId): Promise<User | null> {
      const [row] = await tx.select().from(users).where(eq(users.id, id));
      return row ? toDomain(row) : null;
    },
    async findByNombre(nombre: string): Promise<User | null> {
      const [row] = await tx.select().from(users).where(eq(users.nombre, nombre));
      return row ? toDomain(row) : null;
    },
    async findAllByBusiness(): Promise<readonly User[]> {
      return (await tx.select().from(users)).map(toDomain);
    },
    async countDirectors(): Promise<number> {
      // No roles on the device model (A-05); the owner is an account, not a
      // users row. Kept for interface compatibility.
      return 0;
    },
  };
}

function writes(tx: Tx, businessId: BusinessId) {
  return {
    async create(input: CreateUserInput): Promise<User> {
      const now = new Date().toISOString();
      const [row] = await tx
        .insert(users)
        .values({
          ...input,
          permissions: JSON.stringify(input.permissions ?? { canCancelSales: false }),
          id: newUlid(),
          deviceId: PORTAL_DEVICE_ID,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (!row) throw new Error('El operador no se guardó.');
      await recordChange(tx, businessId, 'users', row.id, 'insert');
      return toDomain(row);
    },
    async update(id: UserId, patch: UserPatch): Promise<User> {
      // Permissions are stored as the JSON the phones parse.
      const { permissions, ...rest } = patch;
      const [row] = await tx
        .update(users)
        .set({
          ...rest,
          ...(permissions === undefined ? {} : { permissions: JSON.stringify(permissions) }),
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(users.id, id)))
        .returning();
      // Gone between the use case's read and this write: the owner's sentence, not an incident.
      if (!row) throw new OperatorNotFoundError();
      await recordChange(tx, businessId, 'users', id, 'update');
      return toDomain(row);
    },
  };
}

export function pgUsersRepository(tx: Tx, businessId: BusinessId): UsersRepository {
  return {
    ...reads(tx),
    ...writes(tx, businessId),
    // Operators are deactivated, never deleted: sales and cancellations name
    // them by id, and a phone may still hold rows they created.
    delete(): Promise<void> {
      throw new TypeError('Los operadores se desactivan; no se eliminan.');
    },
  };
}
