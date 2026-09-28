import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import { contarMovimientos, listMovimientos, resumenMovimientos } from '../src/queries';
import type { FiltroMovimientos } from '../src/queries';

import { integrationSuite } from './support/db';
import { testId } from './support/test-ids';

/**
 * Ventas y gastos searches the concepto, the folio and the operador (owner
 * decision, 2026-09-27; DS-01). The seed puts no ticket on a shift, so an
 * operator search against it would match nothing whether the join works or
 * not: this builds two operators on two shifts, a folio that is a prefix of
 * another, and a concepto that contains a folio's digits.
 */
const { url, describe } = integrationSuite();

const BIZ = testId('K');
const DEV = testId('D');
const [ANA, BETO] = [testId('U'), testId('U')];
const [TURNO_ANA, TURNO_BETO] = [testId('R'), testId('R')];
const PROD = testId('P');
const NOW = new Date('2026-05-12T14:00:00Z');
const MAYO = { desde: '2026-05-01', hasta: '2026-05-31' } as const;

describe('Movimientos: search by concepto, folio and operador', () => {
  let app: Db;
  let owner: postgres.Sql;
  const ventas = (buscar: string) =>
    withBusiness(app, BIZ, (tx) => listMovimientos(tx, 'venta', { ...MAYO, buscar }));
  const gastos = (buscar: string) =>
    withBusiness(app, BIZ, (tx) => listMovimientos(tx, 'gasto', { ...MAYO, buscar }));
  const conceptos = (rows: readonly { concepto: string }[]) => rows.map((r) => r.concepto).sort();

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    const fila = { business_id: BIZ, device_id: DEV, created_at: NOW, updated_at: NOW };
    await owner`INSERT INTO businesses ${owner({ id: BIZ, nombre: 'Búsqueda', regimen_fiscal: 'RESICO', isr_tasa: 125, ...fila })}`;
    await owner`INSERT INTO products ${owner({ id: PROD, nombre: 'Taco', categoria: 'Producto Terminado', costo_unit_centavos: 100, unidad: 'pza', ...fila })}`;
    for (const [id, nombre] of [
      [ANA, 'Ana Robledo'],
      [BETO, 'Beto Cruz'],
    ] as const) {
      await owner`INSERT INTO users ${owner({ id, nombre, pin_hash: 'x', active: true, ...fila })}`;
    }
    for (const [id, user] of [
      [TURNO_ANA, ANA],
      [TURNO_BETO, BETO],
    ] as const) {
      await owner`INSERT INTO caja_turnos ${owner({ id, user_id: user, fecha: '2026-05-12', apertura_at: NOW, monto_apertura_centavos: 0, efectivo_adicional_centavos: 0, ...fila })}`;
    }
    const venta = async (folio: number, concepto: string, turno: string | null) => {
      const ticket = testId('T');
      await owner`INSERT INTO tickets ${owner({ id: ticket, folio, fecha: '2026-05-12', hora: '12:00:00', concepto: 'Venta', metodo: 'Efectivo', estado_pago: 'pagado', caja_turno_id: turno, ...fila })}`;
      await owner`INSERT INTO sales ${owner({ id: testId('S'), ticket_id: ticket, fecha: '2026-05-12', concepto, categoria: 'Producto', monto_centavos: 100, producto_id: PROD, ...fila })}`;
    };
    await venta(412, 'Taco al pastor', TURNO_ANA);
    await venta(4120, 'Gringa', TURNO_BETO);
    await venta(7, 'Agua 412 ml', null);
    const gasto = (concepto: string, turno: string | null) =>
      owner`INSERT INTO expenses ${owner({ id: testId('E'), fecha: '2026-05-12', concepto, categoria: 'Renta', monto_centavos: 100, caja_turno_id: turno, ...fila })}`;
    await gasto('Gas', TURNO_ANA);
    await gasto('Hielo 412', null);
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${BIZ}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('a number finds its folio exactly, and still the concepto that contains it', async () => {
    assert.deepEqual(conceptos(await ventas('412')), ['Agua 412 ml', 'Taco al pastor']);
  });

  it('reads «#412» and «folio 412» as the folio, not as text', async () => {
    assert.deepEqual(conceptos(await ventas('#412')), ['Taco al pastor']);
    assert.deepEqual(conceptos(await ventas('Folio 412')), ['Taco al pastor']);
  });

  it('finds the operator by any part of the name, without case, on ventas and gastos', async () => {
    assert.deepEqual(conceptos(await ventas('ana')), ['Taco al pastor']);
    assert.deepEqual(conceptos(await ventas('CRUZ')), ['Gringa']);
    assert.deepEqual(conceptos(await gastos('robledo')), ['Gas']);
  });

  it('an egreso has no folio: a number matches only its concepto', async () => {
    assert.deepEqual(conceptos(await gastos('412')), ['Hielo 412']);
  });

  it('a typed % is text for the operator too, and a row with no shift names nobody', async () => {
    assert.deepEqual(await ventas('a%'), []);
    assert.deepEqual(conceptos(await ventas('Agua')), ['Agua 412 ml']);
  });

  it('a number past any folio is searched as text, never an error', async () => {
    assert.deepEqual(await ventas('99999999999999'), []);
  });

  it('the count and the summary follow the same search as the rows', async () => {
    const filtro: FiltroMovimientos = { ...MAYO, buscar: 'ana' };
    const [n, g] = await withBusiness(
      app,
      BIZ,
      async (tx) =>
        [
          await contarMovimientos(tx, 'venta', filtro),
          await resumenMovimientos(tx, 'venta', filtro),
        ] as const,
    );
    assert.equal(n, 1);
    assert.deepEqual(
      g.map((x) => [x.clasificacion, x.filas]),
      [['Efectivo', 1]],
    );
  });
});
