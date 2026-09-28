/**
 * The ticket in progress (Track M, M-07): taps, steppers and the summary,
 * on `@xangarro/caja/caja`'s math.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  agregar,
  piezasTexto,
  resumenTicket,
  useTicketEnCurso,
} from '../../../src/screens/Ventas/ticket-en-curso';

const pastor = { id: 'pastor', nombre: 'Taco de pastor', precio: 25_00n };
const gringa = { id: 'gringa', nombre: 'Gringa', precio: 60_00n };

afterEach(() => useTicketEnCurso.getState().vaciar());

describe('agregar', () => {
  it('adds a new line, then counts up the same one', () => {
    const una = agregar([], pastor);
    expect(una).toEqual([
      { productoId: 'pastor', nombre: 'Taco de pastor', precio: 25_00n, cantidad: 1 },
    ]);
    expect(agregar(una, pastor)[0]?.cantidad).toBe(2);
    expect(agregar(una, gringa)).toHaveLength(2);
  });
});

describe('useTicketEnCurso', () => {
  it('keeps the lines, steps them and drops one at zero', () => {
    const t = useTicketEnCurso.getState();
    t.agregar(pastor);
    t.agregar(pastor);
    t.agregar(gringa);
    expect(resumenTicket(useTicketEnCurso.getState().lines)).toEqual({ piezas: 3, total: 110_00n });
    useTicketEnCurso.getState().bump('gringa', -1);
    expect(useTicketEnCurso.getState().lines.map((l) => l.productoId)).toEqual(['pastor']);
    useTicketEnCurso.getState().quitar('pastor');
    expect(useTicketEnCurso.getState().lines).toEqual([]);
  });

  it('says pieces in the singular and plural', () => {
    expect(piezasTexto(1)).toBe('1 pieza');
    expect(piezasTexto(5)).toBe('5 piezas');
  });
});
