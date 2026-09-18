import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  addProducto,
  bump,
  cambio,
  contar,
  parseRecibido,
  total,
} from '../../src/operador/caja/ticket';
import type { LineaTicket, Producto } from '../../src/operador/caja/types';

const pastor: Producto = {
  id: 'pastor',
  nombre: 'Taco de pastor',
  precio: 25_00n,
  categoria: 'Tacos',
  existencias: 140,
  umbral: 10,
  icono: 'flame',
};
const gringa: LineaTicket = { productoId: 'gringa', nombre: 'Gringa', precio: 60_00n, cantidad: 1 };

describe('ticket', () => {
  it('adds a new product as one unit and bumps an existing line', () => {
    const once = addProducto([], pastor);
    assert.deepEqual(once, [
      { productoId: 'pastor', nombre: 'Taco de pastor', precio: 25_00n, cantidad: 1 },
    ]);
    assert.equal(addProducto(once, pastor)[0]?.cantidad, 2);
  });

  it('totals in centavos and counts units, not lines', () => {
    const lines = [
      { ...gringa },
      { productoId: 'pastor', nombre: 'Taco de pastor', precio: 25_00n, cantidad: 3 },
    ];
    assert.equal(total(lines), 135_00n);
    assert.equal(contar(lines), 4);
    assert.equal(total([]), 0n);
  });

  it('drops a line when its quantity reaches zero', () => {
    assert.deepEqual(bump([gringa], 'gringa', -1), []);
    assert.equal(bump([gringa], 'gringa', 2)[0]?.cantidad, 3);
    assert.deepEqual(bump([gringa], 'no-existe', 1), [gringa]);
  });

  it('parses what the customer hands over, in pesos, into centavos', () => {
    assert.equal(parseRecibido('200'), 200_00n);
    assert.equal(parseRecibido('135.5'), 135_50n);
    assert.equal(parseRecibido(''), null);
    assert.equal(parseRecibido('.'), null);
  });

  it('computes change, negative when the cash falls short', () => {
    assert.equal(cambio(200_00n, 135_00n), 65_00n);
    assert.equal(cambio(100_00n, 135_00n), -35_00n);
    assert.equal(cambio(null, 135_00n), null);
  });
});
