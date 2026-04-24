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
  SaleId,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BIZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;
const DEFAULT_VENTA = '01HZ8XQN9GZJXV8AKQ5X0C7SAL' as SaleId;

export function makeNewClient(overrides: Partial<NewClient> = {}): NewClient {
  return {
    nombre: 'Laura Hernández',
    telefono: '3312345678',
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeClient(overrides: Partial<Client> = {}): Client {
  const id = (overrides.id ?? newEntityId<ClientId>()) as ClientId;
  return {
    id,
    nombre: 'Laura Hernández',
    telefono: '3312345678',
    email: null,
    nota: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Client;
}

export function makeNewClientPayment(
  overrides: Partial<NewClientPayment> = {},
): NewClientPayment {
  return {
    ventaId: DEFAULT_VENTA,
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
    ventaId: DEFAULT_VENTA,
    fecha: '2026-04-23' as IsoDate,
    montoCentavos: 50_000n,
    metodo: 'Transferencia',
    nota: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as ClientPayment;
}
