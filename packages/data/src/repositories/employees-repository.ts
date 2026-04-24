/**
 * EmployeesRepository — nómina records (CLAUDE.md keeps this intentionally
 * minimal: fixed-salary rows, no IMSS/ISR withholding math).
 */

import type { BusinessId, Employee, EmployeeId, NewEmployee } from '@cachink/domain';

export type { Employee, NewEmployee };

export interface EmployeesRepository {
  create(input: NewEmployee): Promise<Employee>;
  findById(id: EmployeeId): Promise<Employee | null>;
  /** Employees still on payroll (non-deleted) for the business. */
  listActive(businessId: BusinessId): Promise<readonly Employee[]>;
  delete(id: EmployeeId): Promise<void>;
}
