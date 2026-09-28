/**
 * «¿Qué pasó con la mercancía?» on the phone (M-09): whole units, a merma
 * never takes more than there is and always says what happened, and the
 * detalle joins the reason and the note as the web records them.
 */
import { describe, expect, it } from 'vitest';
import { movimientoDominio } from '@xangarro/caja/lectura';
import type { Existencia } from '@xangarro/caja/inventario';
import {
  avisoHecho,
  borradorInicial,
  cta,
  detalle,
  listo,
  paso,
  quedan,
  tipoAlAbrir,
} from '../../../src/screens/Inventario/mover-logica';

const PASTOR: Existencia = {
  id: 'pastor',
  nombre: 'Carne de pastor',
  corto: 'pastor',
  existencias: 8,
  umbral: 15,
  unidad: 'kg',
  icono: 'ham',
  tint: '',
};
const TORTILLA: Existencia = {
  ...PASTOR,
  id: 'tortilla',
  existencias: 220,
  umbral: 200,
  unidad: 'piezas',
};

describe('mover-logica', () => {
  it('opens a low product on «Llegó mercancía» and the rest on the merma', () => {
    expect(tipoAlAbrir(PASTOR)).toBe('Entrada');
    expect(tipoAlAbrir(TORTILLA)).toBe('Merma');
    expect(borradorInicial('Entrada').cantidad).toBe(5);
    expect(borradorInicial('Merma').cantidad).toBe(1);
  });

  it('steps by whole units, never under one nor past the stock on a merma', () => {
    const merma = { ...borradorInicial('Merma'), cantidad: 8 };
    expect(paso(merma, PASTOR, 1)).toBe(8);
    expect(paso(borradorInicial('Merma'), PASTOR, -1)).toBe(1);
    expect(paso(borradorInicial('Entrada'), PASTOR, 1)).toBe(6);
  });

  it('asks a merma what happened before it can be recorded', () => {
    const b = borradorInicial('Merma');
    expect(listo(b, PASTOR)).toBe(false);
    expect(listo({ ...b, motivo: 'Se rompió' }, PASTOR)).toBe(true);
    expect(listo({ ...b, motivo: 'Se rompió', cantidad: 9 }, PASTOR)).toBe(false);
    expect(listo(borradorInicial('Entrada'), PASTOR)).toBe(true);
  });

  it('says what the stock will be, and the CTA and the toast in the unit', () => {
    const b = { ...borradorInicial('Merma'), cantidad: 2, motivo: 'Se rompió' as const };
    expect(quedan(b, PASTOR)).toBe('Te van a quedar 6 kg, abajo del aviso');
    expect(quedan({ ...b, cantidad: 9 }, PASTOR)).toBe('Solo hay 8 kg.');
    expect(quedan(borradorInicial('Entrada'), TORTILLA)).toBe('Vas a tener 225 piezas');
    expect(cta({ ...b, cantidad: 1 }, TORTILLA)).toBe('Registrar merma de 1 pieza');
    expect(avisoHecho(b, PASTOR)).toBe('−2 kg de Carne de pastor · Se rompió. Queda en tu turno.');
  });

  it('records a merma as the domain’s salida for «Merma / daño», with the reason in the note', () => {
    const b = {
      ...borradorInicial('Merma'),
      cantidad: 2,
      motivo: 'Se rompió' as const,
      nota: ' se cayó ',
    };
    expect(detalle(b)).toBe('Se rompió · se cayó');
    expect(movimientoDominio(b.tipo, b.cantidad, detalle(b))).toEqual({
      tipo: 'salida',
      motivo: 'Merma / daño',
      cantidad: 2,
      nota: 'Se rompió · se cayó',
    });
    const e = { ...borradorInicial('Entrada'), proveedor: 'La Central' };
    expect(movimientoDominio(e.tipo, e.cantidad, detalle(e))).toEqual({
      tipo: 'entrada',
      motivo: 'Compra a proveedor',
      cantidad: 5,
      nota: 'La Central',
    });
  });
});
