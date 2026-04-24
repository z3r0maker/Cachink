/**
 * RecurringExpense fixture builders.
 */

import type {
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewRecurringExpense,
  RecurringExpense,
  RecurringExpenseId,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BIZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewRecurringExpense(
  overrides: Partial<NewRecurringExpense> = {},
): NewRecurringExpense {
  return {
    concepto: 'Renta',
    categoria: 'Renta',
    montoCentavos: 1_200_000n,
    frecuencia: 'mensual',
    diaDelMes: 1,
    proximoDisparo: '2026-05-01' as IsoDate,
    activo: true,
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeRecurringExpense(
  overrides: Partial<RecurringExpense> = {},
): RecurringExpense {
  const id = (overrides.id ?? newEntityId<RecurringExpenseId>()) as RecurringExpenseId;
  return {
    id,
    concepto: 'Renta',
    categoria: 'Renta',
    montoCentavos: 1_200_000n,
    proveedor: null,
    frecuencia: 'mensual',
    diaDelMes: 1,
    diaDeLaSemana: null,
    proximoDisparo: '2026-05-01' as IsoDate,
    activo: true,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as RecurringExpense;
}
