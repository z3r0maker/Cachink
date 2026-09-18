import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { toastAbono, vistaAbono } from '../../src/operador/cobranza/cliente/abono';
import { estadoCuenta } from '../../src/operador/cobranza/cliente/derive';
import { CUENTAS, HOY } from '../../src/operador/cobranza/cuentas';
import {
  abonosDeHoy,
  estado,
  filtrar,
  rapidos,
  resumen,
  resumenCliente,
} from '../../src/operador/cobranza/derive';

const [mari, chuy, , delgado] = CUENTAS;

describe('cobranza: one account history (D7)', () => {
  it('agrees with Turno: $1,780.00 owed, $760.00 in abonos today, $550.00 of it cash', () => {
    const r = resumen(CUENTAS, HOY);
    assert.equal(r.porCobrar, 1780_00n);
    assert.equal(r.conSaldo, 'Tres clientes con saldo');
    assert.equal(r.abonado, 760_00n);
    assert.equal(r.recibidos, 'Tres abonos recibidos');
    assert.equal(r.efectivo, 550_00n);
  });

  it('says «Un» for one, not «Uno»', () => {
    assert.equal(resumen([mari!], HOY).recibidos, 'Un abono recibido');
    assert.equal(resumen([mari!], HOY).conSaldo, 'Un cliente con saldo');
  });

  it('derives each card from tickets and abonos', () => {
    assert.equal(resumenCliente(mari!), '3 ventas abiertas · la más antigua V-0361 · 8 may');
    assert.equal(resumenCliente(chuy!), '2 ventas abiertas · la más antigua V-0288 · 28 abr');
    assert.equal(resumenCliente(delgado!), 'No debe nada. Última venta liquidada el 9 may.');
    assert.deepEqual(CUENTAS.map(estado), ['Al día', 'Atrasado', 'Al día', 'Sin saldo']);
  });

  it('lists today’s abonos newest first, with the operator’s note', () => {
    assert.deepEqual(
      abonosDeHoy(CUENTAS, HOY).map((a) => [a.cliente, a.hora, a.monto]),
      [
        ['Taller de Chuy', '13:52', 400_00n],
        ['Doña Mari de la tienda', '11:18', 210_00n],
        ['Raúl (obra de la esquina)', '09:40', 150_00n],
      ],
    );
  });

  it('previews an abono oldest first, and an excess as saldo a favor (D5)', () => {
    const e = estadoCuenta(mari!);
    const v = vistaAbono(mari!, e, 200_00n, true);
    assert.equal(v.texto, 'V-0361 · 8 may completa · V-0388 · 11 may parcial');
    assert.equal(v.restante, 140_00n);
    const sobra = vistaAbono(mari!, e, 500_00n, true);
    assert.equal(sobra.aFavor, 160_00n);
    assert.match(sobra.texto, /\$160\.00 a su favor$/);
    assert.equal(
      toastAbono(sobra, 500_00n, 'Efectivo', 'Doña Mari de la tienda'),
      '$500.00 de Doña Mari de la tienda por efectivo. Se aplicó a lo más antiguo; queda $0.00. $160.00 quedan a su favor.',
    );
  });

  it('offers the whole balance and the round amounts that fit', () => {
    assert.deepEqual(rapidos(340_00n), [340_00n, 100_00n, 200_00n]);
    assert.deepEqual(rapidos(0n), []);
  });

  it('filters by balance and lateness, and searches name or phone', () => {
    assert.equal(filtrar(CUENTAS, 'Con saldo', '').length, 3);
    assert.deepEqual(
      filtrar(CUENTAS, 'Atrasados', '').map((c) => c.id),
      ['chuy'],
    );
    assert.deepEqual(
      filtrar(CUENTAS, 'Todos', 'raul').map((c) => c.id),
      ['raul'],
    );
    assert.deepEqual(
      filtrar(CUENTAS, 'Todos', '5544').map((c) => c.id),
      ['delgado'],
    );
  });
});
