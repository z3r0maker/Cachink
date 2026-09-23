import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { listDispositivos, listOperadores } from '../src/queries/equipo-listas';
import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * What Tu equipo knows about an operator and a device (C-2…C-5).
 *
 * None of it is stored on the user or the device: the shift state, today's
 * capture and the phone someone works from are all walked to through
 * `caja_turnos`, and the rejected rows through `sync_rejections`. Three
 * operators here stand for the three states the design's pill names, because
 * the difference between «cerrado» and «sin vincular» is the difference
 * between a quiet operator and one whose rows will never arrive.
 */
const { url, describe } = integrationSuite();

const BIZ = testId('Q');
const HOY = '2026-05-12';
const AYER = '2026-05-11';
const NOW = new Date(`${HOY}T14:32:00Z`);
const AYER_AT = new Date(`${AYER}T09:00:00Z`);

const ABIERTA = testId('1');
const CERRADO = testId('2');
const NUEVA = testId('3');
const DEV = testId('4');
const PROD = testId('5');
// Hoisted, every one of them: `testId` mints a **fresh** id on each call, so
// naming the same row twice inline silently creates two different rows.
const TURNO_ABIERTO = testId('6');
const TURNO_CERRADO = testId('7');
const TICKET_OK = testId('8');
const TICKET_CANCELADO = testId('A');

describe('C-2…C-5: the shift is what knows', () => {
  let app: Db;
  let owner: postgres.Sql;

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    const fila = { business_id: BIZ, device_id: DEV, created_at: NOW, updated_at: NOW };
    await owner`INSERT INTO businesses ${owner({ id: BIZ, nombre: 'Equipo', regimen_fiscal: 'RESICO', isr_tasa: 125, ...fila })}`;
    for (const [id, nombre] of [
      [ABIERTA, 'Ana Abierta'],
      [CERRADO, 'Carlos Cerrado'],
      [NUEVA, 'Nadia Nueva'],
    ] as const) {
      await owner`INSERT INTO users ${owner({ id, nombre, pin_hash: 'x', active: true, ...fila })}`;
    }
    await owner`INSERT INTO devices ${owner({ id: DEV, nombre: 'iPhone de caja', plataforma: 'ios', modelo: 'iPhone 12', business_id: BIZ, created_at: NOW, updated_at: NOW })}`;
    await owner`INSERT INTO products ${owner({ id: PROD, nombre: 'Taco', categoria: 'Producto Terminado', costo_unit_centavos: 980, unidad: 'pieza', ...fila })}`;

    const turno = (id: string, user: string, cierre: Date | null, fecha: string, abre: Date) =>
      owner`INSERT INTO caja_turnos ${owner({ id, user_id: user, fecha, apertura_at: abre, cierre_at: cierre, monto_apertura_centavos: 0, efectivo_adicional_centavos: 0, ...fila })}`;
    // Distinct opening times: «the most recent shift» is meaningless in a tie,
    // and a tie is exactly what two rows built from the same clock produce.
    await turno(TURNO_ABIERTO, ABIERTA, null, HOY, NOW);
    await turno(TURNO_CERRADO, CERRADO, AYER_AT, AYER, AYER_AT);

    // Ana's day: one venta of $75 today, and one cancelled for $500 — the
    // cancelled one must count for nothing in either tile.
    const venta = async (tid: string, sid: string, monto: number, cancel: Date | null) => {
      await owner`INSERT INTO tickets ${owner({ id: tid, folio: monto, fecha: HOY, hora: '14:32:00', concepto: 'Tacos', metodo: 'Efectivo', estado_pago: 'pagado', caja_turno_id: TURNO_ABIERTO, cancelled_at: cancel, ...fila })}`;
      await owner`INSERT INTO sales ${owner({ id: sid, ticket_id: tid, fecha: HOY, concepto: 'Taco ×3', categoria: 'Producto', monto_centavos: monto, producto_id: PROD, ...fila })}`;
    };
    await venta(TICKET_OK, testId('9'), 7500, null);
    await venta(TICKET_CANCELADO, testId('B'), 50000, NOW);

    await owner`INSERT INTO sync_rejections ${owner({ id: testId('C'), device_id: DEV, table_name: 'sales', row_id: testId('D'), code: 'conflict', received_at: NOW, business_id: BIZ, created_at: NOW, updated_at: NOW })}`;
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${BIZ}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  const operadores = () => withBusiness(app, BIZ, (tx) => listOperadores(tx, HOY));

  it('tells the three shift states apart', async () => {
    const rows = await operadores();
    const de = (n: string) => rows.find((o) => o.nombre === n)?.estadoTurno;
    assert.equal(de('Ana Abierta'), 'abierto');
    assert.equal(de('Carlos Cerrado'), 'cerrado');
    // The one that matters: never opened a shift, so no device carries them.
    assert.equal(de('Nadia Nueva'), 'sin_vincular');
  });

  it('counts today, and leaves a cancelled venta out of both tiles', async () => {
    const ana = (await operadores()).find((o) => o.nombre === 'Ana Abierta');
    assert.equal(ana?.capturoHoy, 1, 'the cancelled ticket was counted');
    assert.equal(ana?.cobradoHoy, 7500n, 'the cancelled $500 reached the money');
  });

  it("leaves yesterday's shift out of today's count", async () => {
    const carlos = (await operadores()).find((o) => o.nombre === 'Carlos Cerrado');
    assert.equal(carlos?.capturoHoy, 0);
    assert.equal(carlos?.cobradoHoy, 0n);
  });

  it('names the device from the most recent shift', async () => {
    const ana = (await operadores()).find((o) => o.nombre === 'Ana Abierta');
    assert.equal(ana?.dispositivo, 'iPhone de caja');
    assert.equal((await operadores()).find((o) => o.nombre === 'Nadia Nueva')?.dispositivo, null);
  });

  it('a device names its operator, its open shift and its refused rows', async () => {
    const [d] = await withBusiness(app, BIZ, (tx) => listDispositivos(tx));
    assert.equal(d?.nombre, 'iPhone de caja');
    assert.equal(d?.operador, 'Ana Abierta', 'the latest shift never reached the device card');
    assert.equal(d?.turnoAbierto, true);
    assert.equal(d?.rechazados, 1, 'unresolved rejections are what the strip counts');
  });
});
