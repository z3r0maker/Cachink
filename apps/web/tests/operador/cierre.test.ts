import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  BANDA_CUERPO,
  cerrarHint,
  cerrarLabel,
  conSigno,
  DIF,
  lineaCerrado,
} from '../../src/operador/cierre/copy';
import { desglose, esperadoDe } from '../../src/operador/turno/desglose';
import { TURNO_FIXTURE } from '../../src/operador/turno/fixture';

describe('cierre de turno', () => {
  it('computes the expected cash with the domain calculator: $2,710.00', () => {
    assert.equal(esperadoDe(TURNO_FIXTURE), 2_710_00n);
    assert.equal(TURNO_FIXTURE.esperado, 2_710_00n);
    assert.deepEqual(desglose(TURNO_FIXTURE).at(-1), ['Gastos de caja chica', '−$620.00']);
  });

  it('asks for a reason, then for the note of «Otra razón»', () => {
    assert.equal(cerrarHint(true, false), 'Elige un motivo para poder cerrar.');
    assert.equal(cerrarHint(false, true), 'Escribe la nota para poder cerrar.');
    assert.match(cerrarHint(false, false), /^Al cerrar se guarda el conteo/);
  });

  it('puts the difference in the close button, and says why records block it', () => {
    assert.equal(cerrarLabel({ tipo: 'cuadra', monto: 0n }), 'Cerrar turno');
    assert.equal(
      cerrarLabel({ tipo: 'falta', monto: 70_00n }),
      'Cerrar turno con faltante de $70.00',
    );
    assert.equal(cerrarLabel({ tipo: 'sobra', monto: 5n }), 'Cerrar turno con sobrante de $0.05');
    assert.match(BANDA_CUERPO, /el efectivo esperado se calcula con ellos\.$/);
  });

  it('words the difference and the closed line', () => {
    assert.equal(DIF.sobra.label, 'Sobra');
    assert.equal(conSigno({ tipo: 'falta', monto: 70_00n }), '−$70.00');
    assert.equal(conSigno({ tipo: 'sobra', monto: 910_00n }), '+$910.00');
    assert.equal(conSigno({ tipo: 'cuadra', monto: 0n }), '$0.00');
    assert.equal(
      lineaCerrado({ tipo: 'falta', monto: 1n }, 'Salió un vale', 'Pedro'),
      'Quedó un faltante explicado como «Salió un vale».',
    );
    assert.match(lineaCerrado({ tipo: 'cuadra', monto: 0n }, null, 'Pedro'), /Pedro ya lo tiene/);
  });
});
