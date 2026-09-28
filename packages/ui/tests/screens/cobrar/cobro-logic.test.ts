/**
 * The cobro's rules (Track M, M-07; MvCobro): keypad, bills, change and the
 * confirm button's words, the four methods and the folio.
 */
import { describe, expect, it } from 'vitest';
import {
  billetes,
  comoTecleado,
  estadoEfectivo,
  etiquetaCobrar,
  folioTexto,
  metodoDominio,
  metodosDisponibles,
  teclear,
} from '../../../src/screens/Checkout/cobro-logic';

describe('teclear', () => {
  it('appends digits and replaces a lone zero', () => {
    expect(teclear('', '2')).toBe('2');
    expect(teclear('0', '5')).toBe('5');
    expect(teclear('20', '0')).toBe('200');
  });

  it('allows one point and two decimals at most', () => {
    expect(teclear('', '.')).toBe('0.');
    expect(teclear('12.', '.')).toBe('12.');
    expect(teclear('12.50', '9')).toBe('12.50');
  });

  it('stops at seven digits and deletes the last one', () => {
    expect(teclear('1234567', '8')).toBe('1234567');
    expect(teclear('125', 'borrar')).toBe('12');
    expect(teclear('', 'borrar')).toBe('');
  });
});

describe('billetes', () => {
  it('offers the exact amount and the round bills at or above it, four at most', () => {
    expect(billetes(160_00n)).toEqual([160_00n, 200_00n, 500_00n, 1000_00n]);
    expect(billetes(100_00n)).toEqual([100_00n, 200_00n, 500_00n, 1000_00n]);
    expect(billetes(1200_00n)).toEqual([1200_00n]);
  });

  it('types whole pesos without decimals', () => {
    expect(comoTecleado(200_00n)).toBe('200');
    expect(comoTecleado(160_50n)).toBe('160.50');
  });
});

describe('estadoEfectivo and etiquetaCobrar', () => {
  it('says what is missing until the amount covers the total', () => {
    const nada = estadoEfectivo('', 160_00n);
    expect(nada.alcanza).toBe(false);
    expect(etiquetaCobrar('Efectivo', 160_00n, nada)).toBe('Falta $160.00');
    const poco = estadoEfectivo('100', 160_00n);
    expect(poco.diferencia).toBe(-60_00n);
    expect(etiquetaCobrar('Efectivo', 160_00n, poco)).toBe('Falta $60.00');
  });

  it('gives the change, or says exact', () => {
    const e = estadoEfectivo('200', 160_00n);
    expect(e.alcanza).toBe(true);
    expect(etiquetaCobrar('Efectivo', 160_00n, e)).toBe('Cobrar y dar $40.00');
    expect(etiquetaCobrar('Efectivo', 160_00n, estadoEfectivo('160', 160_00n))).toBe(
      'Cobrar $160.00',
    );
  });

  it('reads a half-typed decimal as the whole number', () => {
    expect(estadoEfectivo('200.', 160_00n).recibido).toBe(200_00n);
  });

  it('card and transfer just charge the total', () => {
    expect(etiquetaCobrar('Tarjeta', 160_00n, estadoEfectivo('', 160_00n))).toBe('Cobrar $160.00');
  });
});

describe('methods and folio', () => {
  it('stores Fiado as Crédito and keeps the rest', () => {
    expect(metodoDominio('Fiado')).toBe('Crédito');
    expect(metodoDominio('Transferencia')).toBe('Transferencia');
  });

  it('offers what the business takes, in the boards order, and always Fiado', () => {
    expect(metodosDisponibles(['Tarjeta', 'Efectivo'])).toEqual(['Efectivo', 'Tarjeta', 'Fiado']);
    expect(metodosDisponibles(['QR/CoDi', 'Efectivo'])).toEqual(['Efectivo', 'Fiado']);
  });

  it('writes the folio as V- and four digits', () => {
    expect(folioTexto(413)).toBe('V-0413');
    expect(folioTexto(12345)).toBe('V-12345');
  });
});
