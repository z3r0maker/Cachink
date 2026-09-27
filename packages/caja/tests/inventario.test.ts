import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { INVENTARIO_FIXTURE } from '../src/inventario/fixture';
import {
  aplicar,
  buscar,
  conUnidad,
  delta,
  enLista,
  nivel,
  paraReponer,
  resumen,
} from '../src/inventario/derive';
import type { Movimiento } from '../src/inventario/types';

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

describe('inventario: units, the stock bar and what to restock', () => {
  const base = items[0]!;

  it('agrees the unit with the amount', () => {
    assert.equal(conUnidad(1, 'piezas'), '1 pieza');
    assert.equal(conUnidad(220, 'piezas'), '220 piezas');
    assert.equal(conUnidad(1, 'kg'), '1 kg');
  });

  it('fills the bar with the threshold at half, full at twice it', () => {
    assert.equal(nivel({ ...base, existencias: 5, umbral: 10 }), 25);
    assert.equal(nivel({ ...base, existencias: 40, umbral: 10 }), 100);
    assert.equal(nivel({ ...base, existencias: 3, umbral: 0 }), 100);
  });

  it('names what to restock, or says all is above its aviso', () => {
    const arriba = items.map((i) => ({ ...i, existencias: i.umbral + 1 }));
    assert.equal(paraReponer(arriba), 'Todo está arriba de su aviso');
    const uno = arriba.map((i, n) => (n === 0 ? { ...i, existencias: 0 } : i));
    const corto = base.corto;
    assert.equal(paraReponer(uno), corto.charAt(0).toUpperCase() + corto.slice(1));
    assert.match(paraReponer(items), / y /);
  });
});
