/**
 * InventoryMovement fixture builders.
 */

import type {
  BusinessId,
  DeviceId,
  InventoryMovement,
  InventoryMovementId,
  IsoDate,
  IsoTimestamp,
  NewInventoryMovement,
  ProductId,
} from '@cachink/domain';
import { newEntityId } from '@cachink/domain';

const DEFAULT_BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BIZ' as BusinessId;
const DEFAULT_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const DEFAULT_TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;
const DEFAULT_PRODUCT = '01HZ8XQN9GZJXV8AKQ5X0C7PRD' as ProductId;

export function makeNewInventoryMovement(
  overrides: Partial<NewInventoryMovement> = {},
): NewInventoryMovement {
  return {
    productoId: DEFAULT_PRODUCT,
    fecha: '2026-04-23' as IsoDate,
    tipo: 'entrada',
    cantidad: 10,
    costoUnitCentavos: 3_500n,
    motivo: 'Compra a proveedor',
    businessId: DEFAULT_BIZ,
    ...overrides,
  };
}

export function makeInventoryMovement(
  overrides: Partial<InventoryMovement> = {},
): InventoryMovement {
  const id = (overrides.id ?? newEntityId<InventoryMovementId>()) as InventoryMovementId;
  return {
    id,
    productoId: DEFAULT_PRODUCT,
    fecha: '2026-04-23' as IsoDate,
    tipo: 'entrada',
    cantidad: 10,
    costoUnitCentavos: 3_500n,
    motivo: 'Compra a proveedor',
    nota: null,
    businessId: DEFAULT_BIZ,
    deviceId: DEFAULT_DEV,
    createdAt: DEFAULT_TS,
    updatedAt: DEFAULT_TS,
    deletedAt: null,
    ...overrides,
  } as InventoryMovement;
}
