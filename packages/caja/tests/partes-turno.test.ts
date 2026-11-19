import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { esperadoDelTurno } from '@xangarro/domain';

import { abonosEfectivo, partesDelTurno, type FilasPartes } from '../src/lectura/partes-turno';
import { desgloseFirmado, esperadoDe } from '../src/turno/desglose';

const TURNO = {
  id: 'T1',
  montoAperturaCentavos: 800_00n,
  efectivoAdicionalCentavos: 0n,
};

const ticket = (id: string, metodo: string, p: Record<string, unknown> = {}) => ({
  id,
  cajaTurnoId: 'T1' as string | null,
  metodo,
  estadoPago: 'pagado',
  cancelledAt: null as string | null,
  deletedAt: null as string | null,
  ...p,
});
const linea = (ticketId: string, monto: bigint, deletedAt: string | null = null) => ({
  ticketId,
  monto,
  deletedAt,
});
const abono = (
  metodo: string,
  montoCentavos: bigint,
  deletedAt: string | null = null,
  cajaTurnoId: string | null = 'T1',
) => ({
  cajaTurnoId,
  metodo,
  montoCentavos,
  deletedAt,
});
const gasto = (cajaTurnoId: string | null, monto: bigint) => ({
  cajaTurnoId,
  monto,
  deletedAt: null,
});

/** Two cash sales, a card sale, a cancelled cash sale, another turno's sale; abonos; gastos. */
const FILAS = {
  tickets: [
    ticket('A', 'Efectivo'),
    ticket('B', 'Efectivo'),
    ticket('C', 'Tarjeta'),
    ticket('D', 'Efectivo', { cancelledAt: '2026-05-14T18:58:00Z' }),
    ticket('E', 'Efectivo', { cajaTurnoId: 'T0' }),
  ],
  lineas: [
    linea('A', 1_200_00n),
    linea('B', 780_00n),
    linea('B', 50_00n, '2026-05-14T19:00:00Z'),
    linea('C', 300_00n),
    linea('D', 90_00n),
    linea('E', 400_00n),
  ],
  abonos: [
    abono('Efectivo', 400_00n),
    abono('Efectivo', 150_00n),
    abono('Transferencia', 99_00n),
    // Another turno's drawer and no turno at all (ADR-146): neither counts.
    abono('Efectivo', 300_00n, null, 'T0'),
    abono('Efectivo', 200_00n, null, null),
  ],
  gastos: [gasto('T1', 450_00n), gasto('T1', 170_00n), gasto(null, 1_000_00n), gasto('T0', 5n)],
} satisfies FilasPartes;

describe('partesDelTurno', () => {
  it('forms the expected cash from the turno rows: $800 + $1,980 + $550 − $620', () => {
    const p = partesDelTurno(TURNO, FILAS);
    assert.deepEqual(p, {
      fondo: 800_00n,
      ventasEfectivo: 1_980_00n,
      abonosEfectivo: 550_00n,
      gastosEfectivo: 620_00n,
    });
    assert.equal(esperadoDe(p), 2_710_00n);
  });

  it('agrees with the calculator CerrarCajaUseCase stores (O-03)', () => {
    const d = esperadoDelTurno(TURNO, FILAS.tickets, FILAS.lineas, FILAS.abonos, FILAS.gastos);
    assert.equal(esperadoDe(partesDelTurno(TURNO, FILAS)), d);
  });

  it('signs the breakdown as the boards read it', () => {
    const f = desgloseFirmado(partesDelTurno(TURNO, FILAS));
    assert.deepEqual(
      f.map((x) => x.valor),
      ['$800.00', '+$1,980.00', '+$550.00', '−$620.00'],
    );
    assert.equal(f[0]?.nota, 'con el que abriste');
    assert.equal(f[3]?.resta, true);
  });

  it('counts only standing cash abonos', () => {
    assert.equal(abonosEfectivo([abono('Efectivo', 5n, 'x'), abono('Tarjeta', 7n)], 'T1'), 0n);
  });

  it('counts only the abonos this turno received (M5)', () => {
    const abonos = [
      abono('Efectivo', 5n),
      abono('Efectivo', 7n, null, 'T0'),
      abono('Efectivo', 11n, null, null),
    ];
    assert.equal(abonosEfectivo(abonos, 'T1'), 5n);
    assert.equal(abonosEfectivo(abonos, 'T0'), 7n);
  });
});
