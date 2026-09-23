import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { listMovimientos } from '../src/queries/movimientos';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * «Operador» and «Dispositivo» on the ledger (B-3).
 *
 * Neither is stored on a venta or an egreso. The operator is recovered
 * through the shift the ticket belongs to, the device through the sync
 * receipt that delivered the row — two left joins across four tables.
 *
 * The seed links **no** ticket to a shift and writes **no** receipts, so
 * against it both columns read «—» and a broken join would look exactly like
 * a correct one. This builds the rows the seed does not: a ticket on a
 * shift, a receipt from a device, and one of each without them.
 */
const { url, describe } = integrationSuite();

const BIZ = testId('M');
const USER = testId('U');
const DEV = testId('D');
const TURNO = testId('T');
const TICKET_CON = testId('A');
const VENTA_CON = testId('B');
const TICKET_SOLO = testId('C');
const VENTA_SOLO = testId('E');
const PROD = testId('P');
const NOW = new Date('2026-05-12T14:32:00Z');

describe('B-3: who captured a movimiento, and from what', () => {
  let app: Db;
  let owner: postgres.Sql;

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    // `device_id` is the sync origin stamped on every row, and it is run-unique
    // here: `idx_tickets_device_folio` is unique on (device_id, folio), so a
    // shared literal would collide with whatever an earlier run left behind.
    const fila = { business_id: BIZ, device_id: DEV, created_at: NOW, updated_at: NOW };
    await owner`INSERT INTO businesses ${owner({ id: BIZ, nombre: 'Atribución', regimen_fiscal: 'RESICO', isr_tasa: 125, ...fila })}`;
    await owner`INSERT INTO users ${owner({ id: USER, nombre: 'Ana Robledo', pin_hash: 'x', active: true, ...fila })}`;
    await owner`INSERT INTO devices ${owner({ id: DEV, nombre: 'iPhone de caja', plataforma: 'ios', modelo: 'iPhone 12', business_id: BIZ, created_at: NOW, updated_at: NOW })}`;
    await owner`INSERT INTO caja_turnos ${owner({ id: TURNO, user_id: USER, fecha: '2026-05-12', apertura_at: NOW, monto_apertura_centavos: 0, efectivo_adicional_centavos: 0, ...fila })}`;

    await owner`INSERT INTO products ${owner({ id: PROD, nombre: 'Taco al pastor', categoria: 'Producto Terminado', costo_unit_centavos: 980, unidad: 'pieza', ...fila })}`;

    // A venta captured on a shift, delivered by that device.
    await owner`INSERT INTO tickets ${owner({ id: TICKET_CON, folio: 1, fecha: '2026-05-12', hora: '14:32:00', concepto: 'Tacos', metodo: 'Efectivo', estado_pago: 'pagado', caja_turno_id: TURNO, ...fila })}`;
    await owner`INSERT INTO sales ${owner({ id: VENTA_CON, ticket_id: TICKET_CON, fecha: '2026-05-12', concepto: 'Taco al pastor ×3', categoria: 'Producto', monto_centavos: 7500, producto_id: PROD, ...fila })}`;
    await owner`INSERT INTO sync_receipts ${owner({ table_name: 'sales', row_id: VENTA_CON, seq: 1, device_id: DEV, row_updated_at: NOW, received_at: NOW, business_id: BIZ })}`;

    // And one the portal created: no shift, no receipt.
    await owner`INSERT INTO tickets ${owner({ id: TICKET_SOLO, folio: 2, fecha: '2026-05-11', hora: '09:05:00', concepto: 'Refresco', metodo: 'Tarjeta', estado_pago: 'pagado', ...fila })}`;
    await owner`INSERT INTO sales ${owner({ id: VENTA_SOLO, ticket_id: TICKET_SOLO, fecha: '2026-05-11', concepto: 'Refresco ×1', categoria: 'Producto', monto_centavos: 2500, producto_id: PROD, ...fila })}`;
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${BIZ}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('names the operator through the shift, and the device through the receipt', async () => {
    const rows = await withBusiness(app, BIZ, (tx) => listMovimientos(tx, 'venta'));
    const conTodo = rows.find((r) => r.concepto === 'Taco al pastor ×3');
    assert.equal(conTodo?.operador, 'Ana Robledo', 'the shift never reached the operator');
    assert.equal(conTodo?.dispositivo, 'iPhone de caja', 'the receipt never reached the device');
  });

  it('leaves both null for a row the portal created, rather than guessing', async () => {
    const rows = await withBusiness(app, BIZ, (tx) => listMovimientos(tx, 'venta'));
    const solo = rows.find((r) => r.concepto === 'Refresco ×1');
    assert.equal(solo?.operador, null);
    assert.equal(solo?.dispositivo, null);
  });

  it('carries the ticket hour, so the date cell can stack it', async () => {
    const rows = await withBusiness(app, BIZ, (tx) => listMovimientos(tx, 'venta'));
    assert.equal(rows.find((r) => r.concepto === 'Taco al pastor ×3')?.hora, '14:32');
  });

  it('keeps the lines of one ticket on one ticket id', async () => {
    // «Ticket promedio» divides by tickets, not by lines: two tacos and a
    // refresco on one ticket is one sale, and the screen tells them apart
    // only by this field.
    const rows = await withBusiness(app, BIZ, (tx) => listMovimientos(tx, 'venta'));
    const ids = rows.map((r) => r.ticketId);
    assert.equal(
      ids.every((id) => id !== null),
      true,
      'a venta line with no ticket id would be counted as its own sale',
    );
    assert.equal(new Set(ids).size, 2, 'two tickets, one line each');
  });
});
