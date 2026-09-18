import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { COBRANZA_FIXTURE } from '../../src/operador/cobranza/fixture';
import {
  abonar,
  aplicar,
  aplicaTexto,
  estado,
  filtrar,
  rapidos,
  resumen,
  resumenCliente,
  saldo,
} from '../../src/operador/cobranza/derive';

const { clientes, abonos } = COBRANZA_FIXTURE;
const mari = clientes[0]!;

describe('cobranza del turno', () => {
  it('agrees with Turno: $1,780.00 owed, $760.00 in abonos, $550.00 of it cash', () => {
    const r = resumen(clientes, abonos);
    assert.equal(r.porCobrar, 1780_00n);
    assert.equal(r.conSaldo, 'Tres clientes con saldo');
    assert.equal(r.abonado, 760_00n);
    assert.equal(r.recibidos, 'Tres abonos recibidos');
    assert.equal(r.efectivo, 550_00n);
  });

  it('says «Un» for one, not «Uno»', () => {
    assert.equal(resumen(clientes.slice(0, 1), abonos.slice(0, 1)).recibidos, 'Un abono recibido');
    assert.equal(resumen(clientes.slice(0, 1), []).conSaldo, 'Un cliente con saldo');
  });

  it('describes each card as the file does', () => {
    assert.equal(resumenCliente(mari), '3 ventas abiertas · la más antigua V-0361 · 8 may');
    assert.equal(resumenCliente(clientes[3]!), 'No debe nada. Última venta liquidada el 9 may.');
    assert.deepEqual(clientes.map(estado), ['Al día', 'Atrasado', 'Al día', 'Sin saldo']);
  });

  it('applies an abono oldest first and settles the covered tickets', () => {
    const a = aplicar(mari, 200_00n);
    assert.equal(aplicaTexto(mari, a), 'V-0361 · 8 may completa · V-0388 · 11 may parcial');
    const despues = abonar(mari, a);
    assert.equal(saldo(despues), 140_00n);
    assert.deepEqual(
      despues.abiertas.map((v) => v.folio),
      ['V-0409', 'V-0388'],
    );
  });

  it('offers the whole balance and the round amounts that fit', () => {
    assert.deepEqual(rapidos(340_00n), [340_00n, 100_00n, 200_00n]);
    assert.deepEqual(rapidos(0n), []);
  });

  it('filters by balance and lateness, and searches name or phone', () => {
    assert.equal(filtrar(clientes, 'Con saldo', '').length, 3);
    assert.deepEqual(
      filtrar(clientes, 'Atrasados', '').map((c) => c.id),
      ['chuy'],
    );
    assert.deepEqual(
      filtrar(clientes, 'Todos', 'raul').map((c) => c.id),
      ['raul'],
    );
    assert.deepEqual(
      filtrar(clientes, 'Todos', '5544').map((c) => c.id),
      ['delgado'],
    );
  });
});
