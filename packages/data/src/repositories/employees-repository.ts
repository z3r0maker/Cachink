/**
 * EmployeesRepository — nómina records (CLAUDE.md keeps this intentionally
 * minimal: fixed-salary rows, no IMSS/ISR withholding math).
 */

import type { BusinessId, Employee, EmployeeId, NewEmployee, UpdateEmployee } from '@cachink/domain';

export type { Employee, NewEmployee, UpdateEmployee };

export interface EmployeesRepository {
  create(input: NewEmployee): Promise<Employee>;
  findById(id: EmployeeId): Promise<Employee | null>;
  /** Partial-update an active employee. Throws if not found or deleted. */
  update(id: EmployeeId, input: UpdateEmployee): Promise<Employee>;
  /** Employees still on payroll (non-deleted) for the business. */
  listActive(businessId: BusinessId): Promise<readonly Employee[]>;
  delete(id: EmployeeId): Promise<void>;
}
