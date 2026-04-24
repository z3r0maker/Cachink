/**
 * Business fixture builders.
 */

import type {
  Business,
  BusinessId,
  DeviceId,
  IsoTimestamp,
  NewBusiness,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BIZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewBusiness(overrides: Partial<NewBusiness> = {}): NewBusiness {
  return {
    nombre: 'Tortillería La Esperanza',
    regimenFiscal: 'RIF',
    isrTasa: 0.3,
    logoUrl: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    ...overrides,
  };
}

export function makeBusiness(overrides: Partial<Business> = {}): Business {
  const id = (overrides.id ?? newEntityId<BusinessId>()) as BusinessId;
  return {
    id,
    nombre: 'Tortillería La Esperanza',
    regimenFiscal: 'RIF',
    isrTasa: 0.3,
    logoUrl: null,
    businessId: id,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Business;
}
