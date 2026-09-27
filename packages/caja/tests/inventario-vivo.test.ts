import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  contar,
  delTurno,
  movimientoDominio,
  stockDeCaja,
  type FilaMovimiento,
} from '../src/lectura/inventario-mapa';
import {
  comoExistencia,
  comoMovimiento,
  cortoDe,
  iconoOperador,
  unidadOperador,
} from '../src/inventario/vivo';
import { conUnidad } from '../src/inventario/derive';

const DEV = 'dev-1';
const APERTURA = '2026-09-26T14:00:00.000Z';

const fila = (over: Partial<FilaMovimiento>): FilaMovimiento => ({
  id: 'm',
  productoId: 'p1',
  tipo: 'entrada',
  cantidad: 5,
  motivo: 'Compra a proveedor',
  nota: null,
  origen: 'manual',
  deviceId: DEV,
  createdAt: '2026-09-26T15:00:00.000Z',
  deletedAt: null,
  ...over,
});

describe('inventario vivo · unidades', () => {
  it("says the domain's units in the operator's words", () => {
    assert.equal(unidadOperador('pza'), 'piezas');
    assert.equal(unidadOperador('kg'), 'kg');
    assert.equal(unidadOperador('lt'), 'litros');
    assert.equal(unidadOperador('caja'), 'cajas');
    assert.equal(unidadOperador('par'), 'pares');
    assert.equal(unidadOperador('otro'), 'piezas');
    assert.equal(conUnidad(1, unidadOperador('lt')), '1 litro');
    assert.equal(conUnidad(1, unidadOperador('caja')), '1 caja');
    assert.equal(conUnidad(3, unidadOperador('pza')), '3 piezas');
  });

  it('maps an icon onto the glyphs and keeps the short name lower-case', () => {
    assert.equal(iconoOperador('beef'), 'ham');
    assert.equal(iconoOperador('cup-soda'), 'soda');
    assert.equal(iconoOperador(null), 'pot');
    assert.equal(iconoOperador('wrench'), 'pot');
    assert.equal(cortoDe('Carne de pastor'), 'carne de pastor');
    assert.equal(cortoDe('IVA'), 'IVA');
  });

  it('builds an Existencia, never below zero on screen', () => {
    const e = comoExistencia({
      id: 'p1',
      nombre: 'Salsa verde',
      existencias: -2,
      umbral: 3,
      unidad: 'lt',
      icono: null,
      color: 'green',
      categoria: 'Producto Terminado',
    });
    assert.equal(e.existencias, 0);
    assert.equal(e.unidad, 'litros');
    assert.equal(e.corto, 'salsa verde');
  });
});

describe('inventario vivo · movimientos del turno', () => {
  it('keeps this device’s manual entradas and mermas since the apertura, oldest first', () => {
    const rows = [
      fila({ id: 'b', createdAt: '2026-09-26T16:00:00.000Z', nota: 'Don Beto' }),
      fila({
        id: 'a',
        tipo: 'salida',
        motivo: 'Merma / daño',
        cantidad: 2,
        nota: 'Se rompió',
        createdAt: '2026-09-26T15:30:00.000Z',
      }),
      fila({ id: 'venta', tipo: 'salida', motivo: 'Venta', origen: 'venta' }),
      fila({ id: 'venta-vieja', tipo: 'salida', motivo: 'Venta' }),
      fila({ id: 'otro-device', deviceId: 'dev-2' }),
      fila({ id: 'antes', createdAt: '2026-09-26T13:59:59.000Z' }),
      fila({ id: 'cancelacion', motivo: 'Devolución de cliente', origen: 'cancelacion' }),
      fila({ id: 'muestra', tipo: 'salida', motivo: 'Muestra' }),
      fila({ id: 'borrada', deletedAt: '2026-09-26T17:00:00.000Z' }),
    ];
    const movs = delTurno(rows, DEV, APERTURA);
    assert.deepEqual(
      movs.map((m) => [m.id, m.tipo, m.cantidad]),
      [
        ['a', 'Merma', 2],
        ['b', 'Entrada', 5],
      ],
    );
    assert.deepEqual(contar(movs), { entradas: 1, mermas: 1 });
    const m = comoMovimiento(movs[0]!);
    assert.equal(m.existenciaId, 'p1');
    assert.equal(m.detalle, 'Se rompió');
    assert.match(m.hora, /^\d\d:\d\d$/);
  });

  it("records the screen's two moves as the domain's tipo and motivo", () => {
    assert.deepEqual(movimientoDominio('Entrada', 4, 'Carnicería La Central'), {
      tipo: 'entrada',
      motivo: 'Compra a proveedor',
      cantidad: 4,
      nota: 'Carnicería La Central',
    });
    assert.deepEqual(movimientoDominio('Merma', 1, 'Se rompió · se cayó'), {
      tipo: 'salida',
      motivo: 'Merma / daño',
      cantidad: 1,
      nota: 'Se rompió · se cayó',
    });
    assert.deepEqual(movimientoDominio('Entrada', 2, '  '), {
      tipo: 'entrada',
      motivo: 'Compra a proveedor',
      cantidad: 2,
    });
    assert.throws(() => movimientoDominio('Merma', 1.5, 'Se rompió'), /entero/);
    assert.throws(() => movimientoDominio('Entrada', 0, ''), /entero/);
  });

  it('gives the caja tile its stock only when the product tracks it', () => {
    assert.deepEqual(stockDeCaja(null, null), { existencias: 1, umbral: 0 });
    assert.deepEqual(stockDeCaja(2, 3), { existencias: 2, umbral: 3 });
    assert.deepEqual(stockDeCaja(-4, 3), { existencias: 0, umbral: 3 });
  });
});
