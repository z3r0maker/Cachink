/**
 * «Lo de tu turno» (MvTurno): each row's live line and status chip, from the
 * turno's read and the reads beside it (stock, the owner's messages, the
 * queue). Pure, so every wording is pinned in tests. A row whose read has
 * not arrived says nothing here, and the screen keeps its own fixed line.
 */

import { formatMoney, type Money } from '@xangarro/domain';

import type { Aviso } from '../avisos/types';
import { chipVence } from '../gastos/derive';
import { paraReponer, porReponer } from '../inventario/derive';
import type { Existencia } from '../inventario/types';
import type { Movimiento, PendienteRecurrente, TurnoData } from './types';

/** The chip's colour family; the phone's `NavRowChipTone`. */
export type TonoChip = 'red' | 'amber' | 'green' | 'yellow';

export interface ChipFila {
  readonly label: string;
  readonly tone: TonoChip;
}

export interface FilaVivaTurno {
  readonly detail?: string;
  readonly chip?: ChipFila;
}

export type ClaveFilaTurno = 'gastos' | 'fiado' | 'inventario' | 'avisos' | 'pendientes';

export type FilasTurno = Readonly<Record<ClaveFilaTurno, FilaVivaTurno>>;

/** «$620.00 salieron de la caja · 4 comprobantes». */
export function detalleGastos(salieron: Money, comprobantes: number): string {
  if (salieron <= 0n) return 'Nada ha salido de la caja';
  const cuantos =
    comprobantes <= 0
      ? 'sin comprobantes'
      : `${comprobantes} ${comprobantes === 1 ? 'comprobante' : 'comprobantes'}`;
  return `${formatMoney(salieron)} salieron de la caja · ${cuantos}`;
}

/** The due recurrentes: one by name («Gas vence hoy»), several by count. */
export function chipGastos(pendientes: readonly PendienteRecurrente[]): ChipFila | null {
  const [uno] = pendientes;
  if (uno === undefined) return null;
  if (pendientes.length > 1) return { label: `${pendientes.length} por pagar`, tone: 'red' };
  const label = uno.vence >= 0 ? `${uno.nombre} vence hoy` : chipVence(uno.vence);
  return { label, tone: 'red' };
}

/** Every abono of the turno, whatever the method (centavos). */
export const abonosDelTurno = (movimientos: readonly Movimiento[]): Money =>
  movimientos.filter((m) => m.tipo === 'abono').reduce((s, m) => s + m.monto, 0n);

/** «$182.00 fiado hoy · $550.00 en abonos». */
export const detalleFiado = (fiado: Money, abonos: Money): string =>
  `${formatMoney(fiado)} fiado hoy · ${formatMoney(abonos)} en abonos`;

/** What to restock by its short names, or null with nothing stocked to say. */
export function detalleReponer(items: readonly Existencia[] | undefined): string | null {
  return items === undefined || items.length === 0 ? null : paraReponer(items);
}

export function chipReponer(items: readonly Existencia[] | undefined): ChipFila | null {
  const n = (items ?? []).filter(porReponer).length;
  return n === 0 ? null : { label: `${n} por reponer`, tone: 'amber' };
}

/** The newest unread message's title, else the newest message's. */
export function lineaAvisos(avisos: readonly Aviso[] | undefined): string | null {
  if (avisos === undefined) return null;
  const linea = (avisos.find((a) => !a.leido) ?? avisos[0])?.titulo;
  return linea === undefined || linea === '' ? 'Sin mensajes por ahora' : linea;
}

export function chipAvisos(avisos: readonly Aviso[] | undefined): ChipFila | null {
  const n = (avisos ?? []).filter((a) => !a.leido).length;
  return n === 0 ? null : { label: `${n} sin leer`, tone: 'yellow' };
}

/** «Todo enviado», or how many wait (ADR-123: they never block the close). */
export function chipPorEnviar(porEnviar: number): ChipFila {
  return Number.isFinite(porEnviar) && porEnviar > 0
    ? { label: `${porEnviar} por enviar`, tone: 'amber' }
    : { label: 'Todo enviado', tone: 'green' };
}

const fila = (detail: string | null, chip: ChipFila | null): FilaVivaTurno => ({
  ...(detail === null ? {} : { detail }),
  ...(chip === null ? {} : { chip }),
});

export interface LecturasTurno {
  /** The stocked products; absent until Inventario's read lands. */
  readonly existencias?: readonly Existencia[];
  /** The owner's messages, newest first; absent until their read lands. */
  readonly avisos?: readonly Aviso[];
  readonly porEnviar: number;
}

/** Every row of «Lo de tu turno»; the turno's own rows say nothing without one. */
export function filasDelTurno(d: TurnoData | null, l: LecturasTurno): FilasTurno {
  return {
    gastos:
      d === null ? {} : fila(detalleGastos(d.gastos, d.comprobantes), chipGastos(d.pendientes)),
    fiado: d === null ? {} : fila(detalleFiado(d.fiado, abonosDelTurno(d.movimientos)), null),
    inventario: fila(detalleReponer(l.existencias), chipReponer(l.existencias)),
    avisos: fila(lineaAvisos(l.avisos), chipAvisos(l.avisos)),
    // Its line never changes («Lo que se captura sin internet»): the row's own.
    pendientes: fila(null, chipPorEnviar(l.porEnviar)),
  };
}
