/**
 * Employee fixture builders.
 */

import type {
  BusinessId,
  DeviceId,
  Employee,
  EmployeeId,
  IsoTimestamp,
  NewEmployee,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewEmployee(overrides: Partial<NewEmployee> = {}): NewEmployee {
  return {
    nombre: 'María Pérez',
    puesto: 'Cajera',
    salarioCentavos: 3_500_000n,
    periodo: 'quincenal',
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  const id = (overrides.id ?? newEntityId<EmployeeId>()) as EmployeeId;
  return {
    id,
    nombre: 'María Pérez',
    puesto: 'Cajera',
    salarioCentavos: 3_500_000n,
    periodo: 'quincenal',
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Employee;
}
