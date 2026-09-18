import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { cerrarHint, conSigno, DIF, lineaCerrado } from '../../src/operador/cierre/copy';
import { desglose, esperadoDe } from '../../src/operador/turno/desglose';
import { TURNO_FIXTURE } from '../../src/operador/turno/fixture';

describe('cierre de turno', () => {
  it('computes the expected cash with the domain calculator: $2,870.00', () => {
    assert.equal(esperadoDe(TURNO_FIXTURE), 2_870_00n);
    assert.equal(TURNO_FIXTURE.esperado, 2_870_00n);
    assert.deepEqual(desglose(TURNO_FIXTURE).at(-1), ['Gastos de caja chica', '−$620.00']);
  });

  it('blocks the close first on the queue, then on the missing note', () => {
    assert.equal(cerrarHint(3, true), 'Primero se tienen que enviar los 3 registros pendientes.');
    assert.equal(cerrarHint(0, true), 'Elige un motivo y escribe la nota para poder cerrar.');
    assert.match(cerrarHint(0, false), /^Al cerrar se guarda el conteo/);
  });

  it('words the difference and the closed line', () => {
    assert.equal(DIF.sobra.label, 'Sobra');
    assert.equal(conSigno({ tipo: 'falta', monto: 70_00n }), '−$70.00');
    assert.equal(conSigno({ tipo: 'sobra', monto: 910_00n }), '+$910.00');
    assert.equal(conSigno({ tipo: 'cuadra', monto: 0n }), '$0.00');
    assert.equal(
      lineaCerrado({ tipo: 'falta', monto: 1n }, 'Propinas', 'Pedro'),
      'Quedó un faltante explicado como «Propinas».',
    );
    assert.match(lineaCerrado({ tipo: 'cuadra', monto: 0n }, null, 'Pedro'), /Pedro ya lo tiene/);
  });
});
