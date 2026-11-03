/**
 * The animated splash's exit (MarcaSplashAnimado): one whole flip at least,
 * never cut mid-turn, Reduce Motion never waits, and nobody stays behind it
 * past the cap.
 */
import { describe, expect, it } from 'vitest';
import {
  CICLO_MS,
  PRIMERA_VUELTA_MS,
  TOPE_MS,
  momentoDeSalida,
} from '../../src/app/splash/splash-tiempos';

describe('momentoDeSalida', () => {
  it('a fast start still shows the one flip, and no more', () => {
    expect(momentoDeSalida(0, false)).toBe(PRIMERA_VUELTA_MS);
    expect(momentoDeSalida(300, false)).toBe(PRIMERA_VUELTA_MS);
    expect(momentoDeSalida(PRIMERA_VUELTA_MS, false)).toBe(PRIMERA_VUELTA_MS);
  });

  it('a slow start leaves at the end of the next flip, never mid-turn', () => {
    expect(momentoDeSalida(701, false)).toBe(PRIMERA_VUELTA_MS + CICLO_MS);
    expect(momentoDeSalida(1800, false)).toBe(PRIMERA_VUELTA_MS + CICLO_MS);
    expect(momentoDeSalida(1801, false)).toBe(PRIMERA_VUELTA_MS + 2 * CICLO_MS);
  });

  it('Reduce Motion leaves as soon as the app is ready', () => {
    expect(momentoDeSalida(0, true)).toBe(0);
    expect(momentoDeSalida(950, true)).toBe(950);
  });

  it('never stays past the cap, and treats a clock gone backwards as ready now', () => {
    expect(momentoDeSalida(60_000, false)).toBe(TOPE_MS);
    expect(momentoDeSalida(60_000, true)).toBe(TOPE_MS);
    expect(momentoDeSalida(-50, false)).toBe(PRIMERA_VUELTA_MS);
  });
});

describe('aPantalla', async () => {
  const { aPantalla, LIENZO, MONEDA } = await import('../../src/app/splash/splash-capas');

  it('on the board size itself, a box stays where it is', () => {
    expect(aPantalla(MONEDA, { width: LIENZO.w, height: LIENZO.h })).toEqual({
      left: MONEDA.x,
      top: MONEDA.y,
      width: MONEDA.w,
      height: MONEDA.h,
    });
  });

  it('a wider screen (iPad) scales by width and crops top and bottom evenly', () => {
    const c = aPantalla({ x: 0, y: 0, w: LIENZO.w, h: LIENZO.h }, { width: 852, height: 1000 });
    expect(c.width).toBe(852);
    expect(c.left).toBe(0);
    expect(c.top).toBeCloseTo((1000 - 1846) / 2);
  });

  it('the coin stays centred across the screen on any phone', () => {
    const c = aPantalla(MONEDA, { width: 402, height: 874 });
    expect(c.left + c.width / 2).toBeCloseTo(201, 0);
  });
});
