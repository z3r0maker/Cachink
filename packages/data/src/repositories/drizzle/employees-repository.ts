/**
 * Drizzle-backed {@link EmployeesRepository}.
 */

import { and, asc, eq, isNull } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  EmployeeId,
  IsoTimestamp,
  NewEmployee,
  PayrollFrequency,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { Employee, EmployeesRepository } from '../employees-repository.js';
import { employees } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type EmployeeRow = typeof employees.$inferSelect;

export class DrizzleEmployeesRepository implements EmployeesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
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
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
