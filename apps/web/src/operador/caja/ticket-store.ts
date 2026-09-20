'use client';

import { useSyncExternalStore } from 'react';

import { addProducto, bump } from './ticket';
import type { LineaTicket, Producto } from './types';

/**
 * The ticket in progress, as the register's own state (O-13): it survives the
 * lock, an operator switch and walking to another screen — «sin perder el
 * ticket» — because it lives here, not in one screen's useState. The lock
 * flag lives beside it for the same reason: the whole register locks, not one
 * page.
 */

interface Estado {
  readonly lines: readonly LineaTicket[];
  readonly locked: boolean;
}

let estado: Estado = { lines: [], locked: false };
const oyentes = new Set<() => void>();

function set(patch: Partial<Estado>): void {
  estado = { ...estado, ...patch };
  for (const o of oyentes) o();
}

function suscribir(onChange: () => void): () => void {
  oyentes.add(onChange);
  return () => oyentes.delete(onChange);
}

const leer = (): Estado => estado;

export function useTicketEnCurso(): readonly LineaTicket[] {
  return useSyncExternalStore(suscribir, leer).lines;
}

export function useCajaBloqueada(): boolean {
  return useSyncExternalStore(suscribir, leer).locked;
}

/** Seed the store once (a fixture ticket, or empty for a linked register). */
export function sembrarTicket(lines: readonly LineaTicket[]): void {
  if (estado.lines.length === 0 && lines.length > 0) set({ lines });
}

export function add(p: Producto): void {
  set({ lines: addProducto(estado.lines, p) });
}

export function bumpLinea(productoId: string, delta: number): void {
  set({ lines: bump(estado.lines, productoId, delta) });
}

export function reemplazar(lines: readonly LineaTicket[]): void {
  set({ lines });
}

export function bloquear(): void {
  set({ locked: true });
}

export function desbloquear(): void {
  set({ locked: false });
}
