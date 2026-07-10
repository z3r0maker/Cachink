import { describe, expect, it } from 'vitest';
import { fromPesos } from '../../src/money/index.js';
import { calcularMargenProducto } from '../../src/financials/margen-producto.js';

describe('calcularMargenProducto', () => {
  it('computes a normal positive margin', () => {
    const result = calcularMargenProducto(fromPesos('50'), fromPesos('100'));
    expect(result).not.toBeNull();
    expect(result!.gananciaCentavos).toBe(5000n); // $50.00
    expect(result!.margenPct).toBe(50);
  });

  it('computes a 25% margin correctly', () => {
    const result = calcularMargenProducto(fromPesos('37.50'), fromPesos('50'));
    expect(result).not.toBeNull();
    expect(result!.gananciaCentavos).toBe(1250n); // $12.50
    expect(result!.margenPct).toBe(25);
  });

  it('returns null when precioVenta is zero', () => {
    expect(calcularMargenProducto(fromPesos('10'), 0n)).toBeNull();
  });

  it('returns null when precioVenta is negative', () => {
    expect(calcularMargenProducto(fromPesos('10'), -100n)).toBeNull();
  });

  it('returns a negative margin when costo exceeds precio', () => {
    const result = calcularMargenProducto(fromPesos('150'), fromPesos('100'));
    expect(result).not.toBeNull();
    expect(result!.gananciaCentavos).toBe(-5000n); // -$50.00
    expect(result!.margenPct).toBe(-50);
  });

  it('returns 0% margin when costo equals precio', () => {
    const result = calcularMargenProducto(fromPesos('100'), fromPesos('100'));
    expect(result).not.toBeNull();
    expect(result!.gananciaCentavos).toBe(0n);
    expect(result!.margenPct).toBe(0);
  });

  it('handles zero costo (100% margin)', () => {
    const result = calcularMargenProducto(0n, fromPesos('100'));
    expect(result).not.toBeNull();
    expect(result!.gananciaCentavos).toBe(10000n); // $100.00
    expect(result!.margenPct).toBe(100);
  });

  it('rounds fractional margin to 2 decimal places via truncation', () => {
    // costo = $33.33, precio = $100.00 → margin = $66.67 → 66.67%
    const result = calcularMargenProducto(fromPesos('33.33'), fromPesos('100'));
    expect(result).not.toBeNull();
    expect(result!.gananciaCentavos).toBe(6667n); // $66.67
    expect(result!.margenPct).toBe(66.67);
  });

  it('handles 1-centavo price (extreme edge case)', () => {
    // costo = 0, precio = 1 centavo → ganancia = 1 centavo, margin = 100%
    const result = calcularMargenProducto(0n, 1n);
    expect(result).not.toBeNull();
    expect(result!.gananciaCentavos).toBe(1n);
    expect(result!.margenPct).toBe(100);
  });
});
