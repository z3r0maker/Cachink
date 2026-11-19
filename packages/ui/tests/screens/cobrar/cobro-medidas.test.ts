/**
 * The cobro's sizes per phone height (board MvCobroTotal): the fixed parts
 * have to leave the keypad at least its 44 px keys on every phone, or the
 * screen scrolls and the keypad stops being one thumb away.
 */
import { describe, expect, it } from 'vitest';
import { medidasCobro, TECLA_MIN } from '../../../src/screens/Checkout/cobro-medidas';

/** The header, tab bar and pinned foot take this much, plus the safe areas. */
const MARCO = 64 + 64 + 78;

function sobrante(alto: number, arriba: number, abajo: number): number {
  const m = medidasCobro(alto);
  const area = alto - arriba - abajo - MARCO;
  const huecos = m.margen * 2 + m.separacion * 4;
  const teclado = TECLA_MIN * 4 + m.separacionTeclas * 3;
  return area - (m.total + m.metodo + m.cuenta + m.rapido + huecos + teclado);
}

describe('medidasCobro', () => {
  it('grows the total with the phone', () => {
    expect(medidasCobro(667).total).toBeLessThan(medidasCobro(874).total);
    expect(medidasCobro(874).total).toBeLessThan(medidasCobro(956).total);
  });

  it.each([
    ['iPhone SE', 667, 20, 0],
    ['iPhone 13 mini', 812, 50, 34],
    ['iPhone 17e', 844, 47, 34],
    ['iPhone 17 Pro', 874, 62, 34],
    ['iPhone 17 Pro Max', 956, 62, 34],
  ])('%s fits with 44 px keys and no scrolling', (_n, alto, arriba, abajo) => {
    expect(sobrante(alto, arriba, abajo)).toBeGreaterThanOrEqual(0);
  });

  it('changes step exactly at the 740 and 900 px edges', () => {
    expect(medidasCobro(739).total).toBe(medidasCobro(667).total);
    expect(medidasCobro(740).total).toBe(medidasCobro(874).total);
    expect(medidasCobro(899).total).toBe(medidasCobro(874).total);
    expect(medidasCobro(900).total).toBe(medidasCobro(956).total);
  });

  it('a window with no height yet gets the compact sizes', () => {
    expect(medidasCobro(0)).toEqual(medidasCobro(667));
  });

  it('every control stays at least 44 px tall', () => {
    for (const alto of [667, 874, 956]) {
      const m = medidasCobro(alto);
      expect(m.metodo).toBeGreaterThanOrEqual(44);
      expect(m.rapido).toBeGreaterThanOrEqual(44);
    }
  });
});
