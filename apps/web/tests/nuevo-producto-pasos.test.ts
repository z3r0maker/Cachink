import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  categoriaDe,
  errorDelPaso,
  ganancia,
  UNIDADES,
} from '../src/app/(portal)/productos/nuevo/pasos';
import { EMPTY } from '../src/app/(portal)/productos/sheet/use-producto-form';

const d = (patch: Partial<typeof EMPTY>) => ({ ...EMPTY, ...patch });

describe('«Nuevo producto», one step at a time (ADR-107)', () => {
  it('step 1 needs only a name', () => {
    assert.equal(errorDelPaso(d({ nombre: '  ' }), 1), 'Escribe el nombre del producto.');
    assert.equal(errorDelPaso(d({ nombre: 'Taco' }), 1), null);
  });

  it('step 2 needs a cost and a price, in pesos', () => {
    const base = { nombre: 'Taco' };
    assert.equal(
      errorDelPaso(d({ ...base, costo: '', precio: '25' }), 2),
      'Escribe el costo, por ejemplo 12.50',
    );
    assert.equal(
      errorDelPaso(d({ ...base, costo: '9', precio: 'x' }), 2),
      'Escribe el precio de venta, por ejemplo 25.00',
    );
    assert.equal(errorDelPaso(d({ ...base, costo: '9', precio: '25' }), 2), null);
  });

  it('step 3 needs a whole-number alert, but only when stock is counted', () => {
    const ok = { nombre: 'Taco', costo: '9', precio: '25' };
    assert.equal(
      errorDelPaso(d({ ...ok, umbral: '2.5' }), 3),
      'El aviso de stock bajo es un número entero.',
    );
    assert.equal(errorDelPaso(d({ ...ok, umbral: '2.5', seguirStock: false }), 3), null);
    assert.equal(errorDelPaso(d({ ...ok, umbral: '10' }), 3), null);
  });

  it('says what each one earns, in words', () => {
    assert.deepEqual(ganancia('6.10', '20', 'pza'), {
      tono: 'bien',
      texto: 'Ganas $13.90 por pieza (69%)',
    });
    assert.deepEqual(ganancia('30', '25', 'kg'), {
      tono: 'mal',
      texto: 'Ojo: lo vendes $5.00 abajo de lo que te cuesta',
    });
    assert.deepEqual(ganancia('', '', 'pza'), {
      tono: 'nada',
      texto: 'Escribe el costo y el precio y te digo cuánto ganas.',
    });
  });

  it('files materia prima as such and everything else as producto terminado', () => {
    assert.equal(categoriaDe('materia-prima'), 'Materia Prima');
    assert.equal(categoriaDe('venta'), 'Producto Terminado');
    assert.equal(categoriaDe('ambos'), 'Producto Terminado');
  });

  it('names every unit the phone knows', () => {
    assert.deepEqual(
      UNIDADES.map((u) => u.value),
      ['pza', 'kg', 'lt', 'm', 'caja', 'bolsa', 'rollo', 'par', 'otro'],
    );
  });
});
