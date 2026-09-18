import 'server-only';

import type { EmployeesRepository } from '@xangarro/data';
import { employees } from '@xangarro/data-pg';
import { newUlid, type Employee, type EmployeeId } from '@xangarro/domain';
import { and, asc, eq, isNull } from 'drizzle-orm';

import type { Tx } from '../db';
import { PORTAL_DEVICE_ID } from './portal-device';
import { recordChange } from './sync-log';

/**
 * `EmployeesRepository` over Postgres, inside a tenant transaction (P-12).
 * `employees` is DOWN: every write is logged in the same transaction, so the
 * phones' nómina list follows the portal's roster.
 */
const now = (): string => new Date().toISOString();
const iso = (t: string | null): string | null => (t === null ? null : new Date(t).toISOString());
const alive = (id?: EmployeeId) =>
  id === undefined
    ? isNull(employees.deletedAt)
    : and(eq(employees.id, id), isNull(employees.deletedAt));

function toDomain(row: typeof employees.$inferSelect): Employee {
  return {
    ...row,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    deletedAt: iso(row.deletedAt),
  } as unknown as Employee;
}

type Log = (id: string, op: 'insert' | 'update') => Promise<void>;

function creates(tx: Tx, businessId: string, log: Log): Pick<EmployeesRepository, 'create'> {
  return {
    async create(input) {
      const stamp = now();
      const [row] = await tx
        .insert(employees)
        .values({
          ...input,
          id: newUlid(),
          businessId,
          deviceId: PORTAL_DEVICE_ID,
          createdByUserId: null,
          createdAt: stamp,
          updatedAt: stamp,
          deletedAt: null,
        })
        .returning();
      if (!row) throw new Error('employee insert returned no row');
      await log(row.id, 'insert');
      return toDomain(row);
    },
  };
}

export function pgEmployeesRepository(tx: Tx, businessId: string): EmployeesRepository {
  const log: Log = async (id, op) => {
    await recordChange(tx, businessId, 'employees', id, op);
  };
  return {
    ...creates(tx, businessId, log),
    async findById(id) {
      const [row] = await tx.select().from(employees).where(alive(id));
      return row ? toDomain(row) : null;
    },
    async update(id, input) {
      const [row] = await tx
        .update(employees)
        .set({ ...input, updatedAt: now() })
        .where(alive(id))
        .returning();
      if (!row) throw new Error(`employee ${id} not found`);
      await log(row.id, 'update');
      return toDomain(row);
    },
    async listActive() {
      const rows = await tx.select().from(employees).where(alive()).orderBy(asc(employees.nombre));
      return rows.map(toDomain);
    },
    async delete(id) {
      const [row] = await tx
        .update(employees)
        .set({ deletedAt: now(), updatedAt: now() })
        .where(alive(id))
        .returning({ id: employees.id });
      if (row) await log(row.id, 'update');
    },
  };
}
