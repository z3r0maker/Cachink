import type { LlamadaConEstado, MitadPagada, Movimiento } from '@xangarro/data-corp';
import { formatDate, formatMoney, parseIsoDate } from '@xangarro/domain';
import type { MovementKind } from '@xangarro/domain/corp';

/**
 * «Cuentas de socios» in the board's words (E-03, board CD-04): the funding
 * call's halves, and the partner movements' history.
 */
export type Tono = 'ok' | 'warn' | 'bad';

export interface EstadoMitad {
  readonly label: 'Pagado' | 'Pendiente' | 'Vencido';
  readonly detalle: string;
  readonly tono: Tono;
}

const DAY_MS = 86_400_000;

/** Whole days from `a` to `b`, both `YYYY-MM-DD`. */
export function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY_MS);
}

const fechaCorta = (iso: string) => formatDate(parseIsoDate(iso)).replace(/ \d{4}$/, '');

export function estadoMitad(mitad: MitadPagada | null, vence: string, hoy: string): EstadoMitad {
  if (mitad !== null)
    return { label: 'Pagado', detalle: `el ${fechaCorta(mitad.fecha)}`, tono: 'ok' };
  const faltan = diasEntre(hoy, vence);
  if (faltan > 0) {
    return {
      label: 'Pendiente',
      detalle: faltan === 1 ? 'falta 1 día' : `faltan ${faltan} días`,
      tono: 'warn',
    };
  }
  if (faltan === 0) return { label: 'Pendiente', detalle: 'vence hoy', tono: 'warn' };
  const tarde = -faltan;
  return {
    label: 'Vencido',
    detalle: tarde === 1 ? 'venció ayer' : `venció hace ${tarde} días`,
    tono: 'bad',
  };
}

/** The call the hero shows: the newest one with a half still unpaid. */
export function llamadaAbierta(calls: readonly LlamadaConEstado[]): LlamadaConEstado | null {
  return calls.find((c) => c.mitades[1] === null || c.mitades[2] === null) ?? null;
}

const TIPO_SOCIO: Partial<Record<MovementKind, string>> = {
  aportacion_capital: 'Capital social',
  fondeo_mitades: 'Fondeo por mitades',
  aportacion_adicional: 'Aportación adicional',
  prestamo_socio: 'Préstamo a la empresa',
  reembolso_socio: 'Reembolso de préstamo',
  excedente_a_prestamo: 'Excedente a préstamo',
};

export interface FilaSocio {
  readonly id: string;
  readonly fecha: string;
  readonly tipo: string;
  readonly quien: string;
  readonly monto: string;
}

/** One partner movement; `nombres` maps 1 and 2 to «Fundador N · nombre». */
export function filaSocio(m: Movimiento, nombres: Readonly<Record<1 | 2, string>>): FilaSocio {
  const lines = m.lines.filter((l) => l.socio !== undefined);
  const socio = lines[0]?.socio ?? 1;
  const monto = lines.reduce((max, l) => {
    const v = l.debe + l.haber;
    return v > max ? v : max;
  }, 0n);
  const tipo = TIPO_SOCIO[m.kind] ?? m.concepto;
  const sale =
    m.kind === 'reembolso_socio' ? m.reversesEntryId === null : m.reversesEntryId !== null;
  return {
    id: m.id,
    fecha: fechaCorta(m.fecha),
    tipo: m.reversesEntryId === null ? tipo : `Reversa: ${tipo}`,
    quien: nombres[socio],
    monto: `${sale ? '−' : ''}${formatMoney(monto)}`,
  };
}
