import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { GASTOS_FIXTURE } from '../../src/operador/gastos/fixture';
import { filtrar, resumen } from '../../src/operador/gastos/derive';

const gastos = GASTOS_FIXTURE.gastos;

describe('gastos del turno', () => {
  it('counts the expenses: $620.00, the total Turno subtracts', () => {
    const r = resumen(gastos);
    assert.equal(r.cuantos, 5);
    assert.equal(r.total, 620_00n);
    assert.equal(r.sinComprobante, 1);
  });

  it('filters by category and searches concept and supplier without accents', () => {
    assert.equal(filtrar(gastos, 'Insumos', '').length, 2);
    assert.deepEqual(
      filtrar(gastos, 'Todos', 'carbonería').map((g) => g.concepto),
      ['Carbón'],
    );
    assert.deepEqual(
      filtrar(gastos, 'Otros', '').map((g) => g.concepto),
      ['Hielo para las bebidas'],
    );
    assert.equal(filtrar(gastos, 'Transporte', 'gas').length, 0);
  });

  it('counts an empty turno as zero', () => {
    assert.deepEqual(resumen([]), { cuantos: 0, total: 0n, sinComprobante: 0 });
  });
});
