/**
 * Expense fixture builders.
 */

import type {
  BusinessId,
  DeviceId,
  Expense,
  ExpenseId,
  IsoDate,
  IsoTimestamp,
  NewExpense,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BIZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewExpense(overrides: Partial<NewExpense> = {}): NewExpense {
  return {
    fecha: '2026-04-23' as IsoDate,
    concepto: 'Renta del local',
    categoria: 'Renta',
    monto: 1_200_000n,
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeExpense(overrides: Partial<Expense> = {}): Expense {
  const id = (overrides.id ?? newEntityId<ExpenseId>()) as ExpenseId;
  return {
    id,
    fecha: '2026-04-23' as IsoDate,
    concepto: 'Renta del local',
    categoria: 'Renta',
    monto: 1_200_000n,
    proveedor: null,
    gastoRecurrenteId: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Expense;
}
