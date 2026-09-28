import assert from 'node:assert/strict';
import { describe, it, vi } from 'vitest';

import { colors } from '@xangarro/tokens';

/**
 * `listarCortes` (O-37): the closed turnos as the screen's rows — the figures
 * derived from five grouped queries, the estados from the stored difference,
 * and a stored count normalized no matter how old its keys are. The join and
 * the grouping are Postgres's; the shaping is what these tests pin, one result
 * set queued per select so each query's rows are exactly what the test says.
 */

/** One result set per `tx.select(...)`, in call order. */
const pendientes: unknown[][] = [];

vi.mock('@xangarro/data-pg', () => {
  const col = () => Symbol('columna');
  const tabla = new Proxy(
    {},
    { get: (_t, p) => (typeof p === 'string' ? col() : undefined) },
  ) as Record<string, symbol>;
  return {
    cajaTurnos: tabla,
    clientPayments: tabla,
    expenses: tabla,
    sales: tabla,
    tickets: tabla,
    users: tabla,
  };
});
vi.mock('../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) =>
    fn({
      select: () => {
        const filas = pendientes.shift() ?? [];
        // Every drizzle continuation is a no-op; awaiting the chain yields the
        // queued rows, wherever the query happens to await them.
        const paso = {
          from: () => paso,
          innerJoin: () => paso,
          leftJoin: () => paso,
          where: () => paso,
          orderBy: () => paso,
          limit: () => paso,
          groupBy: () => paso,
          then: (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
            Promise.resolve(filas).then(res, rej),
        };
        return paso;
      },
    }),
}));

const { listarCortes } = await import('../src/server/cortes');

interface TurnoFila {
  readonly id: string;
  readonly userId: string;
  readonly fecha: string;
  readonly aperturaAt: string;
  readonly cierreAt: string | null;
  readonly montoAperturaCentavos: bigint;
  readonly efectivoAdicionalCentavos: bigint;
  readonly efectivoEsperadoCentavos: bigint | null;
  readonly diferenciaCentavos: bigint | null;
  readonly aclaradoAt: string | null;
  readonly denominaciones: string | null;
  readonly discrepancyReason: string | null;
  readonly explicacion: string | null;
}

function turno(over: Partial<TurnoFila> = {}): TurnoFila {
  return {
    id: 't-1',
    userId: 'u-1',
    fecha: '2026-05-12',
    aperturaAt: '2026-05-12T14:00:00-06:00',
    cierreAt: '2026-05-12T20:30:00-06:00',
    montoAperturaCentavos: 500_00n,
    efectivoAdicionalCentavos: 100_00n,
    efectivoEsperadoCentavos: 800_00n,
    diferenciaCentavos: 0n,
    aclaradoAt: null,
    denominaciones: null,
    discrepancyReason: null,
    explicacion: null,
    ...over,
  };
}

/** The six result sets of a populated call: join, vivas, fiado, canceladas, gastos, abonos. */
function poblado(
  turnos: readonly TurnoFila[],
  extras: {
    vivas?: unknown[];
    fiado?: unknown[];
    canceladas?: unknown[];
    gastos?: unknown[];
    abonos?: unknown[];
  } = {},
): void {
  pendientes.push(
    turnos.map((t) => ({ t, nombre: 'Ana Robledo', color: null })),
    extras.vivas ?? [],
    extras.fiado ?? [],
    extras.canceladas ?? [],
    extras.gastos ?? [],
    extras.abonos ?? [],
  );
}

describe('listarCortes', () => {
  it('a business with no closed turno is an empty list, and asks nothing else', async () => {
    pendientes.push([]);
    assert.deepEqual(await listarCortes('biz-1'), []);
    assert.equal(pendientes.length, 0);
  });

  it('shapes a closed turno from its five queries: figures, stats, conteo and estado', async () => {
    poblado([turno()], {
      vivas: [{ turno: 't-1', n: 3, monto: '15000' }],
      fiado: [{ turno: 't-1', n: 1, monto: '5000' }],
      canceladas: [{ turno: 't-1', n: 1, monto: '2500' }],
      gastos: [
        { turno: 't-1', monto: 3000n },
        { turno: null, monto: 999n },
      ],
      abonos: [
        { fecha: '2026-05-12', monto: 1500n },
        { fecha: '2026-05-12', monto: 500n },
      ],
    });
    const [corte] = await listarCortes('biz-1');
    assert.deepEqual(corte, {
      id: 't-1',
      operador: 'Ana Robledo',
      iniciales: 'AR',
      tint: colors.yellow,
      caja: 'Caja 1',
      dia: '12 may',
      horario: '14:00 a 20:30',
      fondo: 600_00n,
      // esperado − fondo − abonos del día + gastos de caja
      ventasEfectivo: 800_00n - 600_00n - 2000n + 3000n,
      abonosEfectivo: 2000n,
      gastosCaja: 3000n,
      conteo: {},
      motivo: null,
      nota: null,
      estado: 'Cuadró',
      turno: {
        ventas: 3,
        canceladas: { n: 1, monto: 2500n },
        fiado: 5000n,
        inventario: '0 entradas · 0 mermas',
        creados: 0,
      },
    });
  });

  it('the estado reads the stamp first, then the difference', async () => {
    poblado([
      turno({ id: 't-1' }),
      turno({ id: 't-2', diferenciaCentavos: 50n }),
      // aclarado wins even with a difference still stored
      turno({ id: 't-3', diferenciaCentavos: 50n, aclaradoAt: '2026-05-13T09:00:00-06:00' }),
    ]);
    const cortes = await listarCortes('biz-1');
    assert.deepEqual(
      cortes.map((c) => c.estado),
      ['Cuadró', 'Por aclarar', 'Aclarado'],
    );
  });

  it('a turno with no figures anywhere reads zeros, and falls back to the fondo as its esperado', async () => {
    poblado([turno({ id: 't-solo', efectivoEsperadoCentavos: null })]);
    const [corte] = await listarCortes('biz-1');
    assert.equal(corte.ventasEfectivo, 0n);
    assert.equal(corte.abonosEfectivo, 0n);
    assert.equal(corte.gastosCaja, 0n);
    assert.deepEqual(corte.turno, {
      ventas: 0,
      canceladas: { n: 0, monto: 0n },
      fiado: 0n,
      inventario: '0 entradas · 0 mermas',
      creados: 0,
    });
  });

  it('a stored count normalizes current keys, old peso keys, and survives garbage', async () => {
    poblado([
      turno({ id: 't-1', denominaciones: '{"billete-100": 2, "20": 3}' }),
      turno({ id: 't-2', denominaciones: '{"billete-100": -1, "moneda-0.50": 1.5, "otra": 2}' }),
      turno({ id: 't-3', denominaciones: 'no es json' }),
      turno({ id: 't-4', denominaciones: '"un texto"' }),
    ]);
    const cortes = await listarCortes('biz-1');
    assert.deepEqual(cortes[0]?.conteo, { 'billete-100': 2, 'billete-20': 3 });
    // negative, fractional and unknown-key counts all drop
    assert.deepEqual(cortes[1]?.conteo, {});
    assert.deepEqual(cortes[2]?.conteo, {});
    assert.deepEqual(cortes[3]?.conteo, {});
  });
});
