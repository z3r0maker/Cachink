/**
 * The ticket in progress on this device (Track M, M-07): the lines the
 * operator tapped, kept in a module store so they survive the trip from the
 * Cobrar tab to the cobro screens and back, as the web caja's
 * `ticket-store.ts` does. The math is `@xangarro/caja/caja` (`bump`, `total`,
 * `contar`); the web's `addProducto` wants the design fixture's `Producto`
 * (four fixed categories, the caja icon set), so a new line is built here from
 * the three facts a line has and every later tap goes through `bump`.
 */
import { create } from 'zustand';
import type { Money } from '@xangarro/domain';
import { bump, contar, total, type LineaTicket } from '@xangarro/caja/caja';

/** What a tap needs to know about the product. */
export interface ProductoParaTicket {
  readonly id: string;
  readonly nombre: string;
  readonly precio: Money;
}

export function agregar(
  lines: readonly LineaTicket[],
  p: ProductoParaTicket,
): readonly LineaTicket[] {
  if (lines.some((l) => l.productoId === p.id)) return bump(lines, p.id, 1);
  return [...lines, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
}

interface TicketEnCurso {
  readonly lines: readonly LineaTicket[];
  readonly agregar: (p: ProductoParaTicket) => void;
  readonly bump: (productoId: string, delta: number) => void;
  readonly quitar: (productoId: string) => void;
  readonly vaciar: () => void;
}

export const useTicketEnCurso = create<TicketEnCurso>((set) => ({
  lines: [],
  agregar: (p) => set((s) => ({ lines: agregar(s.lines, p) })),
  bump: (id, delta) => set((s) => ({ lines: bump(s.lines, id, delta) })),
  quitar: (id) => set((s) => ({ lines: s.lines.filter((l) => l.productoId !== id) })),
  vaciar: () => set({ lines: [] }),
}));

/** Units and the amount, as the bar and the sheet say them. */
export function resumenTicket(lines: readonly LineaTicket[]): {
  readonly piezas: number;
  readonly total: Money;
} {
  return { piezas: contar(lines), total: total(lines) };
}

/** «1 pieza», «5 piezas». */
export const piezasTexto = (n: number): string => `${n} ${n === 1 ? 'pieza' : 'piezas'}`;
