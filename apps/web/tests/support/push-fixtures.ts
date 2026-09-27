import { randomUUID } from 'node:crypto';
import type { Delta } from '@xangarro/contracts';

/**
 * Pushed rows for the Postgres push suites (ADR-110): one device, a default
 * business, and the tables those suites exercise. Each delta takes the next
 * clientSeq, as a phone's outbox would.
 */
export const pushId = () => `01PUSH${randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`;

export const PUSH_T1 = '2026-09-26T10:00:00.000Z';

/** Every table a push suite writes, for its `afterAll` to empty by business. */
export const PUSH_TOUCHED = [
  'expenses',
  'inventory_movements',
  'products',
  'tickets',
  'sync_log',
  'sync_receipts',
  'sync_rejections',
  'sync_cursors',
  'devices',
];

export function pushFixtures(business: string, device: string) {
  let clientSeq = 0;

  function delta(table: Delta['table'], row: Record<string, unknown>, biz = business): Delta {
    const full = {
      businessId: biz,
      deviceId: device,
      createdByUserId: null,
      createdAt: PUSH_T1,
      updatedAt: PUSH_T1,
      ...row,
    };
    clientSeq += 1;
    return {
      table,
      rowId: String(row['id']),
      op: 'insert',
      clientSeq,
      row: full,
    } as unknown as Delta;
  }

  const expense = (rowId: string, over: Record<string, unknown> = {}, biz = business) =>
    delta(
      'expenses',
      {
        id: rowId,
        fecha: '2026-09-26',
        concepto: 'Renta',
        categoria: 'Renta',
        monto: 150000,
        ...over,
      },
      biz,
    );

  const product = (rowId: string, biz = business) =>
    delta(
      'products',
      {
        id: rowId,
        nombre: 'Café',
        categoria: 'Producto Terminado',
        costoUnitCentavos: 1000,
        unidad: 'pza',
      },
      biz,
    );

  const movement = (rowId: string, productoId: string, biz = business) =>
    delta(
      'inventory_movements',
      {
        id: rowId,
        productoId,
        fecha: '2026-09-26',
        tipo: 'salida',
        cantidad: 1,
        costoUnitCentavos: 1000,
        motivo: 'Venta',
      },
      biz,
    );

  const ticket = (rowId: string, folio: number) =>
    delta('tickets', {
      id: rowId,
      folio,
      fecha: '2026-09-26',
      concepto: 'Venta',
      metodo: 'Efectivo',
      estadoPago: 'pagado',
    });

  return { delta, expense, product, movement, ticket };
}
