import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { estado } from '../src/cobranza/derive';
import {
  comoCuenta,
  diaCuenta,
  inicialesCliente,
  metodoAbonoDe,
  type FilaCuenta,
} from '../src/cobranza/lectura';
import { saldo } from '../src/cobranza/derive';
import { HOY } from '../src/fixtures';

const fila: FilaCuenta = {
  id: 'cl-1',
  nombre: 'Taller de Chuy',
  telefono: null,
  creado: '2026-01-06T10:00:00.000Z',
  limite: null,
  plazoDias: 15,
  ventas: [
    {
      folio: 288,
      concepto: 'Comida para 6',
      fecha: '2026-05-02',
      hora: '14:20',
      monto: 460_00n,
      capturo: 'Ana Robledo · Caja 1',
    },
    {
      folio: 310,
      concepto: 'Gringas y aguas',
      fecha: HOY,
      hora: '13:52',
      monto: 100_00n,
      capturo: 'Ana Robledo · Caja 1',
    },
  ],
  abonos: [
    { id: 'ab-1', fecha: '2026-05-02', monto: 100_00n, metodo: 'QR/CoDi', nota: null },
    { id: 'ab-2', fecha: HOY, monto: 60_00n, metodo: 'Efectivo', nota: 'Efectivo parcial' },
  ],
};

describe('cobranza · the phone reads an account (M-08)', () => {
  it('says the ticket and the abono with folio, day and captor', () => {
    const c = comoCuenta(fila, HOY);
    assert.deepEqual(
      c.ventas.map((v) => [v.folio, v.dia, v.capturo]),
      [
        ['V-0288', '2 may', 'Ana Robledo · Caja 1'],
        ['V-0310', 'hoy', 'Ana Robledo · Caja 1'],
      ],
    );
    assert.deepEqual(
      c.abonos.map((a) => [a.dia, a.nota]),
      [
        ['2 may', undefined],
        ['hoy', 'Efectivo parcial'],
      ],
    );
    assert.equal(saldo(c), 400_00n);
    assert.equal(c.desde, 'enero de 2026');
    assert.equal(c.telefono, '');
    assert.equal(c.limite, 0n);
    assert.equal(c.plazo, '15 días');
  });

  it('an abono taken as QR/CoDi reads «Transferencia» (ADR-108)', () => {
    assert.equal(metodoAbonoDe('QR/CoDi'), 'Transferencia');
    assert.equal(metodoAbonoDe('Crédito'), 'Transferencia');
    assert.equal(metodoAbonoDe('Tarjeta'), 'Tarjeta');
    assert.equal(metodoAbonoDe('Efectivo'), 'Efectivo');
  });

  it('flags atrasado from the facts: the oldest ticket is past its plazo', () => {
    const atrasada: FilaCuenta = {
      ...fila,
      ventas: [{ ...fila.ventas[0]!, fecha: '2026-04-20', hora: '13:00', monto: 800_00n }],
      abonos: [],
    };
    assert.equal(estado(comoCuenta(atrasada, HOY)), 'Atrasado');
    assert.equal(estado(comoCuenta(fila, HOY)), 'Al día');
    // A client with no plazo is never atrasado.
    const sinPlazo: FilaCuenta = { ...atrasada, plazoDias: null };
    assert.equal(estado(comoCuenta(sinPlazo, HOY)), 'Al día');
  });

  it('the days and the initials say themselves', () => {
    assert.equal(diaCuenta(HOY, HOY), 'hoy');
    assert.equal(diaCuenta(`${HOY}T11:00`, HOY), 'hoy');
    assert.equal(diaCuenta('2026-05-06', HOY), '6 may');
    assert.equal(inicialesCliente('Doña Mari de la tienda'), 'DM');
    assert.equal(inicialesCliente('Chuy'), 'C');
  });
});
