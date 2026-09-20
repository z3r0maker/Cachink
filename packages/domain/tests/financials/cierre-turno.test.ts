import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { CorteInvalidoError } from '../../src/errors/caja-errors.js';
import {
  DENOMINACIONES_MXN,
  diferenciaCorte,
  efectivoEsperado,
  esperadoDelTurno,
  totalContado,
} from '../../src/financials/cierre-turno.js';

/** The operator handoff's turno: $800 + $2,140 + $550 − $620. */
const TURNO = {
  fondo: 800_00n,
  ventasEfectivo: [1_000_00n, 1_140_00n],
  abonosEfectivo: [400_00n, 150_00n],
  gastosCaja: [620_00n],
};

describe('efectivoEsperado (ADR-074 §3: one calculator per turno)', () => {
  it('reproduces the handoff: $2,870.00', () => {
    assert.equal(efectivoEsperado(TURNO), 2_870_00n);
  });

  it('is the fondo alone when nothing moved', () => {
    assert.equal(
      efectivoEsperado({ fondo: 500_00n, ventasEfectivo: [], abonosEfectivo: [], gastosCaja: [] }),
      500_00n,
    );
  });

  it('rejects a negative fondo', () => {
    assert.throws(() => efectivoEsperado({ ...TURNO, fondo: -1n }), CorteInvalidoError);
  });

  it('rejects a negative sale, abono or expense', () => {
    assert.throws(
      () => efectivoEsperado({ ...TURNO, ventasEfectivo: [-5_00n] }),
      CorteInvalidoError,
    );
    assert.throws(
      () => efectivoEsperado({ ...TURNO, abonosEfectivo: [-5_00n] }),
      CorteInvalidoError,
    );
    assert.throws(
      () => efectivoEsperado({ ...TURNO, gastosCaja: [-5_00n] }),
      (e: unknown) => e instanceof CorteInvalidoError && e.code === 'CORTE_INVALIDO',
    );
  });
});

describe('totalContado and diferenciaCorte', () => {
  it('counts bills and coins from $1,000 down to $1', () => {
    assert.deepEqual(
      DENOMINACIONES_MXN.map((d) => d.valor),
      [1000_00n, 500_00n, 200_00n, 100_00n, 50_00n, 20_00n, 10_00n, 5_00n, 2_00n, 1_00n],
    );
    const conteo = { 1000: 1, 500: 2, 200: 4, 100: 6, 50: 3, 20: 5, 10: 8, 5: 6, 2: 5, 1: 10 };
    assert.equal(totalContado(conteo), 3_780_00n);
    assert.equal(totalContado({}), 0n);
  });

  it('rejects a negative or fractional count', () => {
    assert.throws(() => totalContado({ 100: -1 }), CorteInvalidoError);
    assert.throws(() => totalContado({ 100: 1.5 }), CorteInvalidoError);
  });

  it('says cuadra, falta or sobra with the amount', () => {
    assert.deepEqual(diferenciaCorte(2_870_00n, 2_870_00n), { tipo: 'cuadra', monto: 0n });
    assert.deepEqual(diferenciaCorte(2_800_00n, 2_870_00n), { tipo: 'falta', monto: 70_00n });
    assert.deepEqual(diferenciaCorte(3_780_00n, 2_870_00n), { tipo: 'sobra', monto: 910_00n });
  });
});

describe('esperadoDelTurno (O-03: scoped by cajaTurnoId)', () => {
  const TURNO_ID = '01HZ8XQN9GZJXV8AKQ5X0CTRN' as never;
  const OTRO_TURNO = '01HZ8XQN9GZJXV8AKQ5X0CTRO' as never;

  function fixture() {
    const turno = {
      id: TURNO_ID,
      montoAperturaCentavos: 800_00n,
      efectivoAdicionalCentavos: 0n,
    } as never;
    const tickets = [
      {
        id: 'T1',
        cajaTurnoId: TURNO_ID,
        metodo: 'Efectivo',
        estadoPago: 'pagado',
        cancelledAt: null,
        deletedAt: null,
      },
      {
        id: 'T2',
        cajaTurnoId: TURNO_ID,
        metodo: 'Efectivo',
        estadoPago: 'pagado',
        cancelledAt: null,
        deletedAt: null,
      },
      {
        id: 'T3',
        cajaTurnoId: TURNO_ID,
        metodo: 'Crédito',
        estadoPago: 'pendiente',
        cancelledAt: null,
        deletedAt: null,
      },
      {
        id: 'T4',
        cajaTurnoId: OTRO_TURNO,
        metodo: 'Efectivo',
        estadoPago: 'pagado',
        cancelledAt: null,
        deletedAt: null,
      },
      {
        id: 'T5',
        cajaTurnoId: TURNO_ID,
        metodo: 'Efectivo',
        estadoPago: 'pagado',
        cancelledAt: '2026-05-14T20:00:00.000Z',
        deletedAt: null,
      },
    ] as never[];
    const lineas = [
      { ticketId: 'T1', monto: 1_000_00n, deletedAt: null },
      { ticketId: 'T2', monto: 980_00n, deletedAt: null },
      { ticketId: 'T3', monto: 1_170_00n, deletedAt: null }, // fiado: excluded
      { ticketId: 'T4', monto: 5_000_00n, deletedAt: null }, // otro turno
      { ticketId: 'T5', monto: 7_000_00n, deletedAt: null }, // cancelado
    ] as never[];
    const abonos = [
      { id: 'A1', cajaTurnoId: null, metodo: 'Efectivo', montoCentavos: 400_00n, deletedAt: null },
      {
        id: 'A2',
        cajaTurnoId: null,
        metodo: 'Transferencia',
        montoCentavos: 150_00n,
        deletedAt: null,
      },
    ] as never[];
    const gastos = [
      { id: 'G1', cajaTurnoId: TURNO_ID, monto: 620_00n, deletedAt: null },
      { id: 'G2', cajaTurnoId: OTRO_TURNO, monto: 9_999_00n, deletedAt: null },
      { id: 'G3', cajaTurnoId: null, monto: 1_111_00n, deletedAt: null },
    ] as never[];
    return { turno, tickets, lineas, abonos, gastos };
  }

  it('sums only this turno cash: 800 + 1980 + 400 - 620 = 2560', () => {
    const f = fixture();
    assert.equal(esperadoDelTurno(f.turno, f.tickets, f.lineas, f.abonos, f.gastos), 2_560_00n);
  });

  it('excludes fiado, other turnos, cancelled tickets and non-cash abonos by construction', () => {
    // T3 (Crédito), T4 (otro turno), T5 (cancelado), A2 (Transferencia), G2/G3 (otros/null).
    const { turno, tickets, lineas, gastos } = fixture();
    const soloEfectivo = esperadoDelTurno(
      turno,
      tickets,
      lineas,
      [],
      gastos.filter((g: { id: string }) => g.id === 'G1'),
    );
    assert.equal(soloEfectivo, 800_00n + 1_980_00n - 620_00n);
  });

  it('is the fondo + adicional when nothing else belongs to the turno', () => {
    const f = fixture();
    assert.equal(esperadoDelTurno(f.turno, [], [], [], []), 800_00n);
  });

  it('includes efectivoAdicional in the base', () => {
    const f = fixture();
    const turno = { ...f.turno, efectivoAdicionalCentavos: 200_00n } as never;
    assert.equal(esperadoDelTurno(turno, [], [], [], []), 1_000_00n);
  });

  it('rejects a turno without id', () => {
    assert.throws(() => esperadoDelTurno({ montoAperturaCentavos: 1n } as never, [], [], [], []));
  });
});
