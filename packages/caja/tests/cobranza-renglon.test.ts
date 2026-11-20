import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { renglonCuenta } from '../src/cobranza/renglon';
import { comoCuenta } from '../src/cobranza/vivo';
import { cuentaPara, type FilasCuenta } from '../src/lectura/cuentas';

const HOY = '2026-05-14';

/** Taller de Chuy: tickets of $800.00 (28 Apr) and $460.00 (2 May), $400.00 abonado today, plazo 15 días. */
const CHUY: FilasCuenta = {
  cliente: {
    id: 'chuy',
    nombre: 'Taller de Chuy',
    telefono: '5533 981 204',
    createdAt: '2026-01-10T12:00:00Z',
    limiteCentavos: 1500_00n,
    plazoDias: 15,
  },
  ventas: [
    {
      id: 't1',
      folio: 288,
      concepto: 'Comida para 6',
      fecha: '2026-04-28',
      hora: '13:10',
      createdByUserId: 'u1',
    },
    {
      id: 't2',
      folio: 310,
      concepto: 'Comida para 8',
      fecha: '2026-05-02',
      hora: null,
      createdByUserId: null,
    },
  ],
  montos: new Map([
    ['t1', 800_00n],
    ['t2', 460_00n],
  ]),
  abonos: [{ id: 'a1', fecha: HOY, montoCentavos: 400_00n, metodo: 'Efectivo', nota: null }],
  capturos: new Map(),
};

const sinPlazo = (f: FilasCuenta): FilasCuenta => ({
  ...f,
  cliente: { ...f.cliente, plazoDias: null },
});
const abonoEl = (f: FilasCuenta, fecha: string, monto = 400_00n): FilasCuenta => ({
  ...f,
  abonos: [{ id: 'a1', fecha, montoCentavos: monto, metodo: 'Efectivo', nota: null }],
});

const cuenta = (f: FilasCuenta = CHUY) => comoCuenta(cuentaPara(f), HOY);

describe('renglonCuenta: the compact row of Fiado y abonos (RvFiado)', () => {
  it('owes and abonó hoy: «2 ventas abiertas», marked «Abonó hoy»', () => {
    assert.deepEqual(renglonCuenta(cuenta(sinPlazo(CHUY)), HOY), {
      linea: '2 ventas abiertas',
      marca: 'Abonó hoy',
    });
  });

  it('overdue: how long without an abono, marked «Atrasado»', () => {
    assert.deepEqual(renglonCuenta(cuenta(abonoEl(CHUY, '2026-04-28')), HOY), {
      linea: 'Sin abonar hace 16 días',
      marca: 'Atrasado',
    });
  });

  it('overdue with no abono ever says so', () => {
    assert.deepEqual(renglonCuenta(cuenta({ ...CHUY, abonos: [] }), HOY), {
      linea: 'Sin abonos',
      marca: 'Atrasado',
    });
  });

  it("overdue even after today's abono: «Atrasado» wins the mark", () => {
    assert.deepEqual(renglonCuenta(cuenta(CHUY), HOY), { linea: 'Abonó hoy', marca: 'Atrasado' });
  });

  it('owes, on time, last abono days ago: the open sales and no mark', () => {
    const f = abonoEl(
      { ...sinPlazo(CHUY), ventas: [CHUY.ventas[1]!], montos: new Map([['t2', 460_00n]]) },
      '2026-05-10',
      100_00n,
    );
    assert.deepEqual(renglonCuenta(cuenta(f), HOY), { linea: '1 venta abierta', marca: null });
  });

  it('owes nothing: the last abono and no mark', () => {
    assert.deepEqual(renglonCuenta(cuenta(abonoEl(CHUY, HOY, 1260_00n)), HOY), {
      linea: 'No debe nada · último abono hoy',
      marca: null,
    });
  });
});
