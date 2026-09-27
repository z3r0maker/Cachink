/**
 * Shared fixtures for the push/pull tests: an activated device against the
 * contracts mock, a rung sale (ticket + line), and the push/pull deps.
 */

import { MOCK_CODES } from '@xangarro/contracts/mock';
import {
  DrizzleAppConfigRepository,
  DrizzleSalesRepository,
  DrizzleTicketsRepository,
  type XangarroDatabase,
} from '@xangarro/data';
import type { BusinessId, DeviceId, ProductId } from '@xangarro/domain';
import { makeFreshDb } from '../../../data/tests/helpers/fresh-db.js';
import { ApiClient } from '../../src/api-client.js';
import { applyReferenceTables } from '../../src/reference-applier.js';

export interface Device {
  db: XangarroDatabase;
  token: string;
  businessId: BusinessId;
  deviceId: DeviceId;
  productId: ProductId;
}

export async function activatedDevice(mockUrl: string): Promise<Device> {
  await fetch(`${mockUrl}/__mock/reset`, { method: 'POST' });
  const client = new ApiClient({ baseUrl: mockUrl });
  const act = await client.activate({
    email: 'dueno@tacoslaesquina.mx',
    code: MOCK_CODES.valid,
    device: { name: 'Test', platform: 'ios', appVersion: '0.1.0', osVersion: '18' },
  });
  if (!act.ok) throw new Error(act.code);
  const db = makeFreshDb();
  await applyReferenceTables(db, act.data.bootstrap.tables, act.data.businessId);
  return {
    db,
    token: act.data.deviceToken,
    businessId: act.data.businessId as BusinessId,
    deviceId: act.data.deviceId as DeviceId,
    productId: act.data.bootstrap.tables.products[0]!.id as ProductId,
  };
}

/** One sale: a ticket header and its line — two pushable rows (ADR-073). */
export async function ringSale(d: Device, productId: ProductId = d.productId): Promise<string> {
  const tickets = new DrizzleTicketsRepository(d.db, d.deviceId);
  const ticket = await tickets.create({
    folio: await tickets.nextFolio(d.businessId),
    fecha: '2026-09-16',
    concepto: 'Tacos',
    metodo: 'Efectivo',
    estadoPago: 'pagado',
    businessId: d.businessId,
  });
  const sale = await new DrizzleSalesRepository(d.db, d.deviceId).create({
    ticketId: ticket.id,
    fecha: '2026-09-16',
    concepto: 'Tacos',
    categoria: 'Producto',
    monto: 4500n,
    productoId: productId,
    cantidad: 3,
    businessId: d.businessId,
  } as never);
  return sale.id;
}

export function pushDeps(
  d: Device,
  mockUrl: string,
  opts: { now?: Date; headers?: Record<string, string>; client?: ApiClient } = {},
) {
  const client = opts.client ?? new ApiClient({ baseUrl: mockUrl, extraHeaders: opts.headers });
  const appConfig = new DrizzleAppConfigRepository(d.db);
  return { db: d.db, appConfig, client, token: d.token, now: () => opts.now ?? new Date() };
}
