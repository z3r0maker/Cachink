import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  contarMovimientos,
  lineasDeTickets,
  listMovimientos,
  resumenMovimientos,
} from '../src/queries';
import { integrationSuite } from './support/db';
import { seedLedger, type LedgerFixture } from './support/ledger-fixture';
import { testId } from './support/test-ids';

/**
 * Ventas y gastos, bounded in SQL (DB2-QRY-02): the period, the search and
 * the category narrow the rows **and** the summary the KPIs are built from,
 * pages are disjoint and newest first, and a timestamped fecha on the month's
 * last day still counts on that day.
 */
const { url, describe } = integrationSuite();
const MAYO = { desde: '2026-05-01', hasta: '2026-05-31' } as const;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

describe('Movimientos: bounded pages and their summary', () => {
  let app: Db;
  let owner: postgres.Sql;
  let fx: LedgerFixture;
  const as = <T>(fn: (tx: Tx) => Promise<T>) => withBusiness(app, fx.biz, fn);

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    fx = await seedLedger(owner, 'G');
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${fx.biz}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  it('keeps the month, both ends and a timestamped last day, and no deleted line', async () => {
    const rows = await as((tx) => listMovimientos(tx, 'venta', MAYO));
    assert.deepEqual(rows.map((r) => r.concepto).sort(), [
      'Agua de horchata',
      'Gringa',
      'Orden 100% maíz',
      'Refresco',
      'Taco al pastor',
    ]);
    assert.deepEqual(
      rows.map((r) => r.fecha),
      ['2026-05-31T22:15:00-06:00', '2026-05-11', '2026-05-10', '2026-05-10', '2026-05-01'],
      'newest first',
    );
    assert.equal(rows.find((r) => r.concepto === 'Gringa')?.cancelada, true);
  });

  it('pages are disjoint, ordered, and cover the period', async () => {
    const [p1, p2, p3] = await as(async (tx) => [
      await listMovimientos(tx, 'venta', MAYO, { limit: 2, offset: 0 }),
      await listMovimientos(tx, 'venta', MAYO, { limit: 2, offset: 2 }),
      await listMovimientos(tx, 'venta', MAYO, { limit: 2, offset: 4 }),
    ]);
    assert.deepEqual([p1.length, p2.length, p3.length], [2, 2, 1]);
    const ids = [...p1, ...p2, ...p3].map((r) => r.id);
    assert.equal(new Set(ids).size, 5);
  });

  it('searches the concepto without case, and a typed % is text', async () => {
    const taco = await as((tx) => listMovimientos(tx, 'venta', { ...MAYO, buscar: 'TACO' }));
    assert.deepEqual(
      taco.map((r) => r.concepto),
      ['Taco al pastor'],
    );
    const pct = await as((tx) => listMovimientos(tx, 'venta', { ...MAYO, buscar: '100%' }));
    assert.deepEqual(
      pct.map((r) => r.concepto),
      ['Orden 100% maíz'],
    );
    const nada = await as((tx) => listMovimientos(tx, 'venta', { ...MAYO, buscar: '%' }));
    assert.deepEqual(
      nada.map((r) => r.concepto),
      ['Orden 100% maíz'],
      '% is not a wildcard',
    );
  });

  it('filters by payment method and by expense category', async () => {
    const credito = await as((tx) =>
      listMovimientos(tx, 'venta', { ...MAYO, clasificacion: 'Crédito' }),
    );
    assert.deepEqual(
      credito.map((r) => r.clasificacion),
      ['Crédito'],
    );
    const nomina = await as((tx) =>
      listMovimientos(tx, 'gasto', { ...MAYO, clasificacion: 'Nómina' }),
    );
    assert.deepEqual(
      nomina.map((r) => r.concepto),
      ['Sueldo Beto', 'Sueldo Lupita'],
    );
  });

  it('summarises the period per method: rows listed, live money, live tickets', async () => {
    const g = await as((tx) => resumenMovimientos(tx, 'venta', MAYO));
    assert.deepEqual(
      g.map((x) => [x.clasificacion, x.filas, x.total, x.tickets]),
      [
        ['Crédito', 1, 8000n, 1],
        ['Efectivo', 3, 6000n, 2],
        ['Tarjeta', 1, 0n, 0],
      ],
      'a cancelled ticket is listed but adds no money and no ticket',
    );
    const gastos = await as((tx) => resumenMovimientos(tx, 'gasto', MAYO));
    assert.deepEqual(
      gastos.map((x) => [x.clasificacion, x.filas, x.total]),
      [
        ['Nómina', 2, 300_000n],
        ['Renta', 1, 500_000n],
      ],
    );
  });

  it('sums per ticket before the ticket join, and keeps a line whose ticket has another day (DB3-QRY-03)', async () => {
    const biz = testId('Q');
    const now = new Date('2026-05-12T14:00:00Z');
    const fila = { business_id: biz, device_id: fx.dev, created_at: now, updated_at: now };
    const [prod, viejo, nuevo] = [testId('P'), testId('T'), testId('T')];
    await owner`INSERT INTO businesses ${owner({ id: biz, nombre: 'Q', regimen_fiscal: 'RESICO', isr_tasa: 125, ...fila })}`;
    await owner`INSERT INTO products ${owner({ id: prod, nombre: 'Taco', categoria: 'Producto Terminado', costo_unit_centavos: 100, unidad: 'pza', ...fila })}`;
    const ticket = (id: string, folio: number, fecha: string, metodo: string) =>
      owner`INSERT INTO tickets ${owner({ id, folio, fecha, hora: '12:00:00', concepto: 'Venta', metodo, estado_pago: 'pagado', ...fila })}`;
    await ticket(viejo, 801, '2026-04-20', 'Transferencia');
    await ticket(nuevo, 802, '2026-05-05', 'Efectivo');
    const linea = (ticketId: string, fecha: string, monto: number) => ({
      id: testId('S'),
      ticket_id: ticketId,
      fecha,
      concepto: 'Taco',
      categoria: 'Producto',
      monto_centavos: monto,
      producto_id: prod,
      ...fila,
    });
    await owner`INSERT INTO sales ${owner([
      linea(viejo, '2026-05-02', 700),
      linea(nuevo, '2026-05-05', 100),
      linea(nuevo, '2026-05-05', 200),
      linea(testId('T'), '2026-05-06', 999),
    ])}`;
    try {
      const g = await withBusiness(app, biz, (tx) => resumenMovimientos(tx, 'venta', MAYO));
      assert.deepEqual(
        g.map((x) => [x.clasificacion, x.filas, x.total, x.tickets]),
        [
          ['Efectivo', 2, 300n, 1],
          ['Transferencia', 1, 700n, 1],
        ],
        'the April ticket still names its May line; the ticketless line is left out',
      );
    } finally {
      await owner`DELETE FROM businesses WHERE id = ${biz}`;
    }
  });

  it('the count agrees with the rows the summary lists', async () => {
    const [n, g, ng] = await as(
      async (tx) =>
        [
          await contarMovimientos(tx, 'venta', MAYO),
          await resumenMovimientos(tx, 'venta', MAYO),
          await contarMovimientos(tx, 'gasto', { ...MAYO, buscar: 'sueldo' }),
        ] as const,
    );
    assert.equal(
      n,
      g.reduce((a, x) => a + x.filas, 0),
    );
    assert.equal(ng, 2);
  });

  it('the summary follows the search, never the category', async () => {
    const g = await as((tx) =>
      resumenMovimientos(tx, 'venta', { ...MAYO, buscar: 'taco', clasificacion: 'Crédito' }),
    );
    assert.deepEqual(
      g.map((x) => [x.clasificacion, x.filas]),
      [['Efectivo', 1]],
    );
  });

  it("gives a ticket's live lines, however the page cut it", async () => {
    const l = await as((tx) => lineasDeTickets(tx, [fx.ticketDoble, fx.ticketDoble]));
    assert.deepEqual(l.map((x) => x.concepto).sort(), ['Agua de horchata', 'Taco al pastor']);
    assert.deepEqual(await as((tx) => lineasDeTickets(tx, [])), []);
  });

  it('another tenant sees none of it', async () => {
    const other = testId('O');
    assert.deepEqual(await withBusiness(app, other, (tx) => listMovimientos(tx, 'venta')), []);
    assert.deepEqual(await withBusiness(app, other, (tx) => resumenMovimientos(tx, 'venta')), []);
    assert.deepEqual(
      await withBusiness(app, other, (tx) => lineasDeTickets(tx, [fx.ticketDoble])),
      [],
    );
  });
});
