/**
 * One read per code in view (M1): a barcode held in front of the camera
 * keeps firing, and only a code that left the view for `REPETIDO_MS` counts
 * again.
 */

import { describe, expect, it } from 'vitest';
import { leerCodigo, REPETIDO_MS } from '../../../src/screens/Ventas/escaner-camara.shared';

/** Feeds sightings of codes at the given times; returns the times that counted. */
function contadas(vistas: readonly (readonly [string, number])[]): number[] {
  let prev = null as ReturnType<typeof leerCodigo>['siguiente'] | null;
  const out: number[] = [];
  for (const [codigo, t] of vistas) {
    const r = leerCodigo(prev, codigo, t);
    if (r.cuenta) out.push(t);
    prev = r.siguiente;
  }
  return out;
}

describe('leerCodigo', () => {
  it('counts the first sighting of a code', () => {
    expect(contadas([['7501', 0]])).toEqual([0]);
  });

  it('never counts a code again while it stays in view', () => {
    const vistas = Array.from({ length: 40 }, (_, i) => ['7501', i * 200] as const);
    expect(contadas(vistas)).toEqual([0]);
  });

  it('counts the same code again once it was out of view long enough', () => {
    expect(
      contadas([
        ['7501', 0],
        ['7501', 300],
        ['7501', 300 + REPETIDO_MS],
      ]),
    ).toEqual([0, 300 + REPETIDO_MS]);
  });

  it('does not count a code that came back before the window ended', () => {
    expect(
      contadas([
        ['7501', 0],
        ['7501', REPETIDO_MS - 1],
      ]),
    ).toEqual([0]);
  });

  it('counts a different code right away', () => {
    expect(
      contadas([
        ['7501', 0],
        ['7502', 100],
      ]),
    ).toEqual([0, 100]);
  });

  it('counts the first code again after another one was read in between', () => {
    expect(
      contadas([
        ['7501', 0],
        ['7502', 100],
        ['7501', 200],
      ]),
    ).toEqual([0, 100, 200]);
  });
});
