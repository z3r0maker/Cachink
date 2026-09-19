/**
 * Client + ClientPayment fixture builders.
 */

import type {
  BusinessId,
  Client,
  ClientId,
  ClientPayment,
  ClientPaymentId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewClient,
  NewClientPayment,
} from '@xangarro/domain';
import { newEntityId } from '@xangarro/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;
const DEFAULT_CLIENTE = '01HZ8XQN9GZJXV8AKQ5X0C7CKJ' as ClientId;

export function makeNewClient(overrides: Partial<NewClient> = {}): NewClient {
  return {
    nombre: 'Laura Hernández',
    telefono: '3312345678',
    estadoRevision: 'aprobado',
    businessId: DEFAULT_BIZ,
    ...overrides,
  } as NewClient;
}

export function makeClient(overrides: Partial<Client> = {}): Client {
  const id = (overrides.id ?? newEntityId<ClientId>()) as ClientId;
  return {
    id,
    nombre: 'Laura Hernández',
    telefono: '3312345678',
    email: null,
    nota: null,
    limiteCentavos: null,
    plazoDias: null,
    estadoRevision: 'aprobado',
    fusionadoConId: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdByUserId: null,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Client;
}

export function makeNewClientPayment(overrides: Partial<NewClientPayment> = {}): NewClientPayment {
  return {
    clienteId: DEFAULT_CLIENTE,
    fecha: '2026-04-23' as IsoDate,
    montoCentavos: 50_000n,
    metodo: 'Transferencia',
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeClientPayment(overrides: Partial<ClientPayment> = {}): ClientPayment {
  const id = (overrides.id ?? newEntityId<ClientPaymentId>()) as ClientPaymentId;
  return {
    id,
    clienteId: DEFAULT_CLIENTE,
    fecha: '2026-04-23' as IsoDate,
    montoCentavos: 50_000n,
    metodo: 'Transferencia',
    nota: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdByUserId: null,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as ClientPayment;
}
