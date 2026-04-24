/**
 * DayClose fixture builders.
 */

import type {
  BusinessId,
  DayClose,
  DayCloseId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewDayClose,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BIZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewDayClose(overrides: Partial<NewDayClose> = {}): NewDayClose {
  return {
    fecha: '2026-04-23' as IsoDate,
    efectivoEsperadoCentavos: 250_000n,
    efectivoContadoCentavos: 248_000n,
    cerradoPor: 'Operativo',
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeDayClose(overrides: Partial<DayClose> = {}): DayClose {
  const id = (overrides.id ?? newEntityId<DayCloseId>()) as DayCloseId;
  return {
    id,
    fecha: '2026-04-23' as IsoDate,
    efectivoEsperadoCentavos: 250_000n,
    efectivoContadoCentavos: 248_000n,
    diferenciaCentavos: -2_000n,
    explicacion: null,
    cerradoPor: 'Operativo',
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as DayClose;
}
