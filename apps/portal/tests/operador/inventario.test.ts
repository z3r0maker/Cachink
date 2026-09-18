import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { INVENTARIO_FIXTURE } from '../../src/operador/inventario/fixture';
import { aplicar, buscar, delta, enLista, resumen } from '../../src/operador/inventario/derive';
import type { Movimiento } from '../../src/operador/inventario/types';

const { existencias: items, movimientos: movs } = INVENTARIO_FIXTURE;

describe('inventario del turno', () => {
  it('counts four items to restock, three entries and two write-offs', () => {
    assert.deepEqual(resumen(items, movs), { porReponer: 4, entradas: 3, mermas: 2 });
  });

  it('names the moved items the way the KPI hints do', () => {
    assert.equal(enLista(movs, items, 'Entrada'), 'Pastor, tortilla y agua');
    assert.equal(enLista(movs, items, 'Merma'), 'Horchata y queso oaxaca');
    assert.equal(enLista([], items, 'Merma'), '');
  });

  it('moves stock: entries add, write-offs subtract and never go below zero', () => {
    const entrada: Movimiento = {
      id: 'x',
      existenciaId: 'bistec',
      tipo: 'Entrada',
      cantidad: 5,
      detalle: '',
      hora: '15:00',
    };
    const merma: Movimiento = { ...entrada, tipo: 'Merma', cantidad: 50 };
    assert.equal(aplicar(items, entrada).find((i) => i.id === 'bistec')?.existencias, 11);
    assert.equal(aplicar(items, merma).find((i) => i.id === 'bistec')?.existencias, 0);
    assert.equal(delta(merma, 'kg'), '−50 kg');
  });

  it('searches without accents', () => {
    assert.deepEqual(
      buscar(items, 'maiz').map((i) => i.id),
      ['tortilla'],
    );
    assert.equal(buscar(items, 'nada').length, 0);
  });
});
