/**
 * Drizzle-backed {@link EmployeesRepository}.
 */

import { and, asc, eq, isNull } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  UserId,
  EmployeeId,
  IsoTimestamp,
  NewEmployee,
  PayrollFrequency,
  UpdateEmployee,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { Employee, EmployeesRepository } from '../employees-repository.js';
import { employees } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type EmployeeRow = typeof employees.$inferSelect;

export class DrizzleEmployeesRepository implements EmployeesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewEmployee): Promise<Employee> {
    const id = newEntityId<EmployeeId>();
    const ts = now();
    const row = {
      id,
      nombre: input.nombre,
      puesto: input.puesto,
      salarioCentavos: input.salarioCentavos,
      periodo: input.periodo,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(employees).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: EmployeeId): Promise<Employee | null> {
    const row = await this.#db
      .select()
      .from(employees)
      .where(and(eq(employees.id, id), isNull(employees.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async update(id: EmployeeId, input: UpdateEmployee): Promise<Employee> {
    const ts = now();
    const updates: Record<string, unknown> = { updatedAt: ts };
    if (input.nombre !== undefined) updates.nombre = input.nombre;
    if (input.puesto !== undefined) updates.puesto = input.puesto;
    if (input.salarioCentavos !== undefined) updates.salarioCentavos = input.salarioCentavos;
    if (input.periodo !== undefined) updates.periodo = input.periodo;
    await this.#db.update(employees).set(updates).where(eq(employees.id, id)).run();
    const row = await this.findById(id);
    if (!row) throw new Error(`Employee ${id} not found after update`);
    return row;
  }

  async listActive(businessId: BusinessId): Promise<readonly Employee[]> {
    const rows = await this.#db
      .select()
      .from(employees)
      .where(and(eq(employees.businessId, businessId), isNull(employees.deletedAt)))
      .orderBy(asc(employees.nombre))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async delete(id: EmployeeId): Promise<void> {
    const ts = now();
    await this.#db
      .update(employees)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(employees.id, id))
      .run();
  }

  #mapRow(row: EmployeeRow): Employee {
    return {
      id: row.id as EmployeeId,
      nombre: row.nombre,
      puesto: row.puesto,
      salarioCentavos: row.salarioCentavos,
      periodo: row.periodo as PayrollFrequency,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
