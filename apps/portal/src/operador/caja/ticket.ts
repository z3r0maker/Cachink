import { fromPesos, multiplyByInteger, sum, type Money } from '@xangarro/domain';

import type { LineaTicket, Producto } from './types';

/**
 * The ticket in progress, as pure functions over centavos. Recording it is the
 * ticket use case's job (ADR-073, C-17); these only shape what is on screen.
 */
export function addProducto(lines: readonly LineaTicket[], p: Producto): readonly LineaTicket[] {
  if (lines.some((l) => l.productoId === p.id)) return bump(lines, p.id, 1);
  return [...lines, { productoId: p.id, nombre: p.nombre, precio: p.precio, cantidad: 1 }];
}

/** Changes a line's quantity; a line that reaches zero leaves the ticket. */
export function bump(
  lines: readonly LineaTicket[],
  productoId: string,
  delta: number,
): readonly LineaTicket[] {
  return lines
    .map((l) => (l.productoId === productoId ? { ...l, cantidad: l.cantidad + delta } : l))
    .filter((l) => l.cantidad > 0);
}

export const importe = (l: LineaTicket): Money => multiplyByInteger(l.precio, l.cantidad);

export const total = (lines: readonly LineaTicket[]): Money => sum(lines.map(importe));

/** Units, not lines: «3 pastor + 1 gringa» is 4. */
export const contar = (lines: readonly LineaTicket[]): number =>
  lines.reduce((n, l) => n + l.cantidad, 0);

/** What the customer hands over, typed in pesos; `null` until it is a number. */
export function parseRecibido(raw: string): Money | null {
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) return null;
  return fromPesos(raw);
}

/** Positive: change to give. Negative: still missing. `null`: nothing typed. */
export const cambio = (recibido: Money | null, cobrar: Money): Money | null =>
  recibido === null ? null : recibido - cobrar;
