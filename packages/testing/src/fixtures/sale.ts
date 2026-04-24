/**
 * Sale fixture builders.
 *
 * `makeNewSale` returns the payload a repository's `create()` expects (no
 * id, no audit stamps). `makeSale` returns the full Sale shape as if the
 * repo had already persisted it — useful when the test needs a Sale value
 * without touching a repository at all.
 */

import type {
  BusinessId,
  ClientId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewSale,
  Sale,
  SaleId,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

export function makeNewSale(overrides: Partial<NewSale> = {}): NewSale {
  return {
    fecha: '2026-04-23' as IsoDate,
    concepto: 'Taco al pastor',
    categoria: 'Producto',
    monto: 450n,
    metodo: 'Efectivo',
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeSale(overrides: Partial<Sale> = {}): Sale {
  const id = (overrides.id ?? newEntityId<SaleId>()) as SaleId;
  const clienteId = (overrides.clienteId ?? null) as ClientId | null;
  return {
    id,
    fecha: '2026-04-23' as IsoDate,
    concepto: 'Taco al pastor',
    categoria: 'Producto',
    monto: 450n,
    metodo: 'Efectivo',
    clienteId,
    estadoPago: 'pagado',
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as Sale;
}
