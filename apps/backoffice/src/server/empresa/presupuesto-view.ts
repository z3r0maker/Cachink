import { formatMoney } from '@xangarro/domain';
import {
  ACCOUNTS,
  rangoDelTrimestre,
  type CategoriaGasto,
  type ImporteResultados,
  type Presupuesto,
  type RecurrenteDelMes,
  type SolicitudGasto,
} from '@xangarro/domain/corp';

import { nombreMes } from './fechas';

/**
 * Presupuesto's shared shapes (E-22, boards CD-15d and CD-15e): what the page
 * reads, its two views (`?vista=trimestre`), the panels it opens (`?panel=`)
 * and its links. Pure.
 */
export interface DatosPresupuesto {
  /** Today, `YYYY-MM-DD` in Mexico. */
  readonly hoy: string;
  /** The P&L lines from the previous quarter's first day to today. */
  readonly importes: readonly ImporteResultados[];
  /** Each month of this quarter from this one on: its recurring charges. */
  readonly recurrentes: ReadonlyMap<string, readonly RecurrenteDelMes[]>;
  /** Entries registered from a template in the three months before this one. */
  readonly deRecurrentes: ReadonlySet<string>;
  readonly presupuestos: readonly Presupuesto[];
  /** This quarter's requests, oldest first. */
  readonly solicitudes: readonly SolicitudGasto[];
  /** `founders.id` → name. */
  readonly socios: ReadonlyMap<string, string>;
}

export type VistaPresupuesto = 'mes' | 'trimestre';

export const parseVista = (v: string | undefined): VistaPresupuesto =>
  v === 'trimestre' ? 'trimestre' : 'mes';

export type PanelPresupuesto = 'preparar' | 'aprobar' | 'pedir' | 'otro';

const PANELES: readonly PanelPresupuesto[] = ['preparar', 'aprobar', 'pedir', 'otro'];

export function parsePanelPresupuesto(v: string | undefined): PanelPresupuesto | null {
  return PANELES.find((p) => p === v) ?? null;
}

export function hrefPresupuesto(
  vista: VistaPresupuesto = 'mes',
  panel: PanelPresupuesto | null = null,
  solicitud: string | null = null,
): string {
  const q = new URLSearchParams();
  if (vista === 'trimestre') q.set('vista', 'trimestre');
  if (panel !== null) q.set('panel', panel);
  if (solicitud !== null) q.set('solicitud', solicitud);
  const s = q.toString();
  return s === '' ? '/empresa/presupuesto' : `/empresa/presupuesto?${s}`;
}

export const nombreCategoria = (c: CategoriaGasto): string => ACCOUNTS[c].nombre;

/** A category's expenses of the month in Movimientos. */
export const hrefCategoria = (c: CategoriaGasto, mes: string): string =>
  `/empresa/movimientos?mes=${mes}&ver=gastos&cat=${c}`;

/** The quarter's months, `YYYY-MM`, oldest first. */
export function mesesDelTrimestre(trimestre: string): readonly string[] {
  const [desde] = rangoDelTrimestre(trimestre);
  const anio = desde.slice(0, 4);
  const primero = Number(desde.slice(5, 7));
  return [0, 1, 2].map((i) => `${anio}-${String(primero + i).padStart(2, '0')}`);
}

/** «23 %», to the nearest whole, half up; null without a base. */
export function porcentaje(parte: bigint, base: bigint): string | null {
  return base <= 0n ? null : `${(parte * 200n + base) / (base * 2n)} %`;
}

/** The other founder's name, as the panels say it. */
export function otroSocio(socios: ReadonlyMap<string, string>, founderId: string): string {
  return [...socios].find(([id]) => id !== founderId)?.[1] ?? 'el otro socio';
}

export const nombreDe = (socios: ReadonlyMap<string, string>, id: string): string =>
  socios.get(id) ?? 'Un socio';

/**
 * «Con este gasto, noviembre cerraría en $38,050.00, 23 % sobre el
 * presupuesto.»: a spend's effect on the month's projection. Pure, so the
 * request forms say it live as the amount is typed.
 */
export function efectoEnElMes(i: {
  readonly mes: string;
  readonly proyeccion: bigint;
  readonly presupuesto: bigint | null;
  readonly monto: bigint;
  readonly inicio?: string;
}): string {
  const cierre = i.proyeccion + i.monto;
  const frase = `${i.inicio ?? 'Con este gasto'}, ${nombreMes(i.mes)} cerraría en ${formatMoney(cierre)}`;
  if (i.presupuesto === null) return `${frase}.`;
  if (cierre <= i.presupuesto) return `${frase}, dentro del presupuesto.`;
  return `${frase}, ${porcentaje(cierre - i.presupuesto, i.presupuesto) ?? ''} sobre el presupuesto.`;
}
