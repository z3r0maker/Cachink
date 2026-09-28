import assert from 'node:assert/strict';
import { afterAll, beforeAll, it } from 'vitest';
import postgres from 'postgres';
import {
  calculateEstadoDeResultados,
  calculateFlujoDeEfectivo,
  conTotales,
  desgloseDeResultados,
  type Expense,
  type Sale,
  type Ticket,
} from '@xangarro/domain';

import { createDb, withBusiness, type Db } from '../src/client';
import {
  egresosPorCategoria,
  periodLedger,
  ticketsDelPeriodo,
  ventasPorTicket,
} from '../src/queries';
import { integrationSuite } from './support/db';
import { seedLedger, type LedgerFixture } from './support/ledger-fixture';
import { testId } from './support/test-ids';

/**
 * Estados reads sums, not rows (DB3-EST-01) — and the statements must not
 * move a centavo for it. The ledger fixture has the edges that matter: a
 * two-line ticket with a deleted third line, a cancelled ticket, a timestamp
 * on the month's last day, days either side of the month, and egresos in two
 * categories. Every figure is checked against the domain run on the raw rows
 * `periodLedger` returns.
 */
const { url, describe } = integrationSuite();
const [DESDE, HASTA] = ['2026-05-01', '2026-05-31'];

describe('estados reads summed in SQL', () => {
  let app: Db;
  let owner: postgres.Sql;
  let fx: LedgerFixture;
  let borrado: string;

  beforeAll(async () => {
    app = createDb(url as string);
    owner = postgres(process.env.DATABASE_SUPER_URL as string, {
      max: 1,
      onnotice: () => undefined,
    });
    fx = await seedLedger(owner, 'W');
    // A deleted ticket inside the month: `between` kept it; the period does not.
    borrado = testId('T');
    const now = new Date('2026-05-12T14:00:00Z');
    await owner`INSERT INTO tickets ${owner({ id: borrado, folio: 99, fecha: '2026-05-20', hora: '12:00:00', concepto: 'Venta', metodo: 'Tarjeta', estado_pago: 'pagado', deleted_at: now, business_id: fx.biz, device_id: fx.dev, created_at: now, updated_at: now })}`;
  });

  afterAll(async () => {
    await owner`DELETE FROM businesses WHERE id = ${fx.biz}`;
    await app?.$client.end({ timeout: 5 });
    await owner?.end({ timeout: 5 });
  });

  const leer = () =>
    withBusiness(app, fx.biz, async (tx) => ({
      porTicket: await ventasPorTicket(tx, DESDE, HASTA),
      porCategoria: await egresosPorCategoria(tx, DESDE, HASTA),
      tickets: (await ticketsDelPeriodo(tx, DESDE, HASTA)) as unknown as Ticket[],
      crudo: await periodLedger(tx, DESDE, HASTA),
    }));

  it('sums lines per ticket and egresos per category, as bigint centavos', async () => {
    const { porTicket, porCategoria } = await leer();
    // 2500 + 1500 (the 999 line is deleted), 8000 on the last day's timestamp, 2000.
    assert.deepEqual(porTicket.map((v) => v.monto).sort(), [2_000n, 4_000n, 8_000n]);
    assert.ok(porTicket.every((v) => typeof v.monto === 'bigint'));
    const categorias = Object.fromEntries(porCategoria.map((e) => [e.categoria, e.monto]));
    assert.deepEqual(categorias, { Nómina: 300_000n, Renta: 500_000n });
  });

  it("takes the period's tickets by day: the last day's timestamp in, the deleted one out", async () => {
    const { tickets } = await leer();
    const fechas = tickets.map((t) => t.fecha).sort();
    assert.deepEqual(fechas, [
      '2026-05-01',
      '2026-05-10',
      '2026-05-11',
      '2026-05-31T22:15:00-06:00',
    ]);
    assert.ok(!tickets.some((t) => t.id === borrado));
  });

  it('gives the domain the same statements the raw rows do, to the centavo', async () => {
    const { porTicket, porCategoria, tickets, crudo } = await leer();
    const ventas = porTicket.map((v) => ({ ...v, deletedAt: null }) as unknown as Sale);
    const egresos = porCategoria as unknown as Expense[];
    const ventasCrudas = crudo.ventas as unknown as Sale[];
    const egresosCrudos = crudo.egresos.map((e) => ({ ...e, monto: e.monto ?? 0n })) as Expense[];

    const er = (v: Sale[], e: Expense[]) =>
      calculateEstadoDeResultados({ ventas: v, egresos: e, isrTasa: 125 });
    assert.deepEqual(er(ventas, egresos), er(ventasCrudas, egresosCrudos));

    const conT = conTotales(tickets, ventas);
    const conTCrudo = conTotales(tickets, ventasCrudas);
    assert.deepEqual(conT, conTCrudo);
    assert.deepEqual(
      desgloseDeResultados({ ventas: conT, egresos }),
      desgloseDeResultados({ ventas: conTCrudo, egresos: egresosCrudos }),
    );
    assert.deepEqual(
      calculateFlujoDeEfectivo({ ventas: conT, egresos, pagosClientes: [] }),
      calculateFlujoDeEfectivo({ ventas: conTCrudo, egresos: egresosCrudos, pagosClientes: [] }),
    );
  });

  it('another tenant reads nothing', async () => {
    const otro = testId('O');
    const r = await withBusiness(app, otro, async (tx) => [
      await ventasPorTicket(tx, DESDE, HASTA),
      await egresosPorCategoria(tx, DESDE, HASTA),
      await ticketsDelPeriodo(tx, DESDE, HASTA),
    ]);
    assert.deepEqual(r, [[], [], []]);
  });

  it('refuses a day that does not exist rather than roll it into the next month', async () => {
    await assert.rejects(
      withBusiness(app, fx.biz, (tx) => ventasPorTicket(tx, '2026-02-01', '2026-02-30')),
      TypeError,
    );
  });
});
