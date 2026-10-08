import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { antiguedad, lineaCuenta } from '../src/cobranza/antiguedad';
import { estado, saldo } from '../src/cobranza/derive';
import { comoCuenta, diaCorto, inicialesDe, metodoAbonoDe } from '../src/cobranza/vivo';
import {
  capturoDe,
  cuentaPara,
  porCobrarDe,
  saldoDeFilas,
  totalDeLineas,
  type FilasCuenta,
} from '../src/lectura/cuentas';

const HOY = '2026-05-14';

/** Taller de Chuy as rows: two Crédito tickets, one abono of $400.00 today. */
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
  capturos: new Map([
    ['t1', 'Ana Robledo · Caja 1'],
    ['t2', 'Caja 1'],
  ]),
};

describe('lectura: a credit account from its rows (the web Worker and the phone)', () => {
  it('sums a ticket from its lines and names who captured it', () => {
    assert.equal(totalDeLineas([{ monto: 100_00n }, { monto: 60_00n }]), 160_00n);
    assert.equal(capturoDe(null, 'Ana'), 'Caja 1');
    assert.equal(capturoDe('u1', 'Ana Robledo'), 'Ana Robledo · Caja 1');
    assert.equal(capturoDe('u9', undefined), 'Caja 1 · Caja 1');
  });

  it('assembles the account with the domain saldo', () => {
    const c = cuentaPara(CHUY);
    assert.equal(c.saldoCentavos, '86000');
    assert.equal(c.limiteCentavos, '150000');
    assert.deepEqual(
      c.ventas.map((v) => [v.folio, v.fecha, v.montoCentavos, v.capturo]),
      [
        [288, '2026-04-28T13:10', '80000', 'Ana Robledo · Caja 1'],
        [310, '2026-05-02T00:00', '46000', 'Caja 1'],
      ],
    );
    assert.deepEqual(c.abonos[0], {
      id: 'a1',
      fecha: HOY,
      montoCentavos: '40000',
      metodo: 'Efectivo',
      nota: null,
    });
    assert.equal(saldoDeFilas(CHUY.ventas, CHUY.montos, []), 1260_00n);
  });

  it('adds what is still owed and counts who owes it', () => {
    const libre = cuentaPara({ ...CHUY, abonos: [], ventas: [], montos: new Map() });
    assert.deepEqual(porCobrarDe([cuentaPara(CHUY), { ...libre, id: 'x' }]), {
      monto: 860_00n,
      clientes: 1,
    });
  });
});

describe('cobranza: the account as the screens read it', () => {
  const c = comoCuenta(cuentaPara(CHUY), HOY);

  it('maps the read, and derives atrasado from the plazo', () => {
    assert.equal(c.iniciales, 'TD');
    assert.equal(c.plazo, '15 días');
    assert.equal(c.ventas[0]?.folio, 'V-0288');
    assert.equal(c.abonos[0]?.dia, 'hoy');
    assert.equal(saldo(c), 860_00n);
    // V-0288 of 28 April was due on 13 May.
    assert.equal(c.atrasado, true);
    assert.equal(estado(c), 'Atrasado');
    const sinPlazo = comoCuenta(
      cuentaPara({ ...CHUY, cliente: { ...CHUY.cliente, plazoDias: null } }),
      HOY,
    );
    assert.equal(sinPlazo.atrasado, false);
  });

  it('says a retired QR/CoDi abono as Transferencia, and short days', () => {
    assert.equal(metodoAbonoDe('QR/CoDi'), 'Transferencia');
    assert.equal(metodoAbonoDe('Tarjeta'), 'Tarjeta');
    assert.equal(diaCorto(HOY, HOY), 'hoy');
    assert.match(diaCorto('2026-05-06', HOY), /6 may/);
    assert.equal(inicialesDe('  doña mari '), 'DM');
  });

  it('ages the debt and the last abono for the phone row', () => {
    assert.deepEqual(antiguedad(c, HOY), { diasDeuda: 16, diasAbono: 0 });
    assert.equal(lineaCuenta(c, HOY), 'Abonó hoy · debe desde hace 16 días');
    const ayer = { ...c, abonos: c.abonos.map((a) => ({ ...a, fecha: '2026-05-13' })) };
    assert.equal(lineaCuenta(ayer, HOY), 'Sin abonar hace 1 día · debe desde hace 16 días');
    assert.equal(lineaCuenta({ ...c, abonos: [] }, HOY), 'Sin abonos · debe desde hace 16 días');
    const pagado = {
      ...c,
      abonos: [{ ...c.abonos[0]!, monto: 1260_00n, dia: '9 may', fecha: '2026-05-09' }],
    };
    assert.equal(lineaCuenta(pagado, HOY), 'No debe nada · último abono 9 may');
    assert.deepEqual(antiguedad(pagado, HOY), { diasDeuda: null, diasAbono: 5 });
  });
});
