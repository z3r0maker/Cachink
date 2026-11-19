/**
 * The movement sheet's rules (RvInventario, M9): the row picks the kind from
 * the stock level, the quantity is typed or stepped in whole units, a merma
 * never takes more than there is («Solo hay 6 kg.») and always says what
 * happened, and the write is the screen's `NuevoMovimientoVivo`.
 */
import { describe, expect, it } from 'vitest';
import type { Existencia } from '@xangarro/caja/inventario';
import {
  borradorInicial,
  cta,
  listo,
  paso,
  payload,
  quedan,
  tipoAlAbrir,
  type Borrador,
} from '../../../src/screens/Inventario/mover-logica';

const PASTOR: Existencia = {
  id: 'pastor',
  nombre: 'Carne de pastor',
  corto: 'pastor',
  existencias: 6,
  umbral: 10,
  unidad: 'kg',
  icono: 'ham',
  tint: '#FFE8EA',
};

const merma = (raw: string, motivo: Borrador['motivo'] = 'Se echó a perder'): Borrador => ({
  tipo: 'Merma',
  raw,
  motivo,
});
const entrada = (raw: string): Borrador => ({ tipo: 'Entrada', raw, motivo: null });

describe('tipoAlAbrir', () => {
  it('low stock opens «Llegó mercancía»', () => {
    expect(tipoAlAbrir(PASTOR)).toBe('Entrada');
  });
  it('enough stock opens the merma', () => {
    expect(tipoAlAbrir({ ...PASTOR, existencias: 30 })).toBe('Merma');
  });
});

describe('borradorInicial', () => {
  it('a delivery starts at five, a write-off at one, with no reason yet', () => {
    expect(borradorInicial('Entrada')).toEqual({ tipo: 'Entrada', raw: '5', motivo: null });
    expect(borradorInicial('Merma')).toEqual({ tipo: 'Merma', raw: '1', motivo: null });
  });
});

describe('listo and payload', () => {
  it('happy: an entrada of 24 records with an empty detalle', () => {
    expect(listo(entrada('24'), PASTOR)).toBe(true);
    expect(payload(entrada('24'), PASTOR)).toEqual({
      tipo: 'Entrada',
      existenciaId: 'pastor',
      cantidad: 24,
      detalle: '',
    });
  });
  it('happy: a merma within the stock carries its reason', () => {
    expect(payload(merma('6', 'Se rompió'), PASTOR)).toEqual({
      tipo: 'Merma',
      existenciaId: 'pastor',
      cantidad: 6,
      detalle: 'Se rompió',
    });
  });
  it('a merma over the stock is not ready (M9)', () => {
    expect(listo(merma('9'), PASTOR)).toBe(false);
    expect(payload(merma('9'), PASTOR)).toBeNull();
  });
  it('a merma without a reason is not ready', () => {
    expect(listo(merma('2', null), PASTOR)).toBe(false);
  });
  it('zero, decimals, empty and letters are not quantities', () => {
    for (const raw of ['0', '1.5', '', 'abc']) expect(listo(entrada(raw), PASTOR)).toBe(false);
  });
});

describe('quedan', () => {
  it('says what the entrada leaves, green when above the aviso', () => {
    expect(quedan(entrada('24'), PASTOR)).toEqual({ texto: 'Vas a tener 30 kg', tono: 'bien' });
  });
  it('says when the result stays under the aviso', () => {
    expect(quedan(entrada('2'), PASTOR)).toEqual({
      texto: 'Vas a tener 8 kg, abajo del aviso',
      tono: 'quieto',
    });
  });
  it('a merma over the stock says only what there is, in red (M9)', () => {
    expect(quedan(merma('9'), PASTOR)).toEqual({ texto: 'Solo hay 6 kg.', tono: 'rojo' });
  });
  it('says nothing while the quantity is not a number', () => {
    expect(quedan(entrada(''), PASTOR)).toEqual({ texto: '', tono: 'quieto' });
  });
});

describe('paso', () => {
  it('steps up and down by one, never under one', () => {
    expect(paso(entrada('5'), PASTOR, 1)).toBe('6');
    expect(paso(entrada('1'), PASTOR, -1)).toBe('1');
  });
  it('an empty field steps to one', () => {
    expect(paso(entrada(''), PASTOR, 1)).toBe('1');
  });
  it('a merma never steps past the stock', () => {
    expect(paso(merma('6'), PASTOR, 1)).toBe('6');
    expect(paso(merma('9'), PASTOR, -1)).toBe('6');
  });
});

describe('cta', () => {
  it('says the move with its quantity and unit', () => {
    expect(cta(entrada('24'), PASTOR)).toBe('Registrar entrada de 24 kg');
    expect(cta(merma('9'), PASTOR)).toBe('Registrar merma de 9 kg');
  });
  it('without a quantity, says the move alone', () => {
    expect(cta(entrada(''), PASTOR)).toBe('Registrar entrada');
  });
});
