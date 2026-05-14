/**
 * In-memory {@link EmployeesRepository}.
 */

import type {
  BusinessId,
  DeviceId,
  Employee,
  EmployeeId,
  IsoTimestamp,
  NewEmployee,
  UpdateEmployee,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { EmployeesRepository } from '@cachink/data';

export class InMemoryEmployeesRepository implements EmployeesRepository {
  private readonly rows = new Map<EmployeeId, Employee>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewEmployee): Promise<Employee> {
    const id = newEntityId<EmployeeId>();
    const ts = now();
    const row: Employee = {
      id,
      nombre: input.nombre,
      puesto: input.puesto,
      salarioCentavos: input.salarioCentavos,
      periodo: input.periodo,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdByUserId: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: EmployeeId): Promise<Employee | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async update(id: EmployeeId, input: UpdateEmployee): Promise<Employee> {
    const existing = this.rows.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`Employee ${id} not found`);
    }
    const ts = now();
    const updated: Employee = {
      ...existing,
      ...(input.nombre !== undefined && { nombre: input.nombre }),
      ...(input.puesto !== undefined && { puesto: input.puesto }),
      ...(input.salarioCentavos !== undefined && { salarioCentavos: input.salarioCentavos }),
      ...(input.periodo !== undefined && { periodo: input.periodo }),
      updatedAt: ts,
    };
    this.rows.set(id, updated);
    return updated;
  }

  async listActive(businessId: BusinessId): Promise<readonly Employee[]> {
    return [...this.rows.values()]
      .filter((r) => r.businessId === businessId && r.deletedAt === null)
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  async delete(id: EmployeeId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
