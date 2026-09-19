/**
 * Metas — the Asesor's goals (P-27). Deterministic arithmetic over the
 * `metas` table's own columns, so the phone, the portal and the celebration
 * all read one rule.
 *
 * «Qué tanto» is a percentage of the last complete month's figure: +10/+20/+30
 * for ganar y vender, the same percentages **down** for gastar — a goal to
 * spend less aims lower, not higher.
 */

import type { IsoDate } from '../dates/index.js';
import type { Money } from '../money/index.js';

export type ObjetivoMeta = 'ganar' | 'vender' | 'gastar';
export type MotivoMeta = 'comprar' | 'colchon' | 'deudas';
export type NivelMeta = 'empujon' | 'reto' | 'ambicioso';

export const NIVELES: readonly { readonly id: NivelMeta; readonly pct: number }[] = [
  { id: 'empujon', pct: 10 },
  { id: 'reto', pct: 20 },
  { id: 'ambicioso', pct: 30 },
];

/** A goal as the table stores it (dates are `YYYY-MM`). */
export interface Meta {
  readonly id: string;
  readonly objetivo: ObjetivoMeta;
  readonly motivo: MotivoMeta;
  readonly nivel: NivelMeta;
  readonly objetivoCentavos: Money;
  /** The month the goal covers, `YYYY-MM`. */
  readonly periodo: string;
  readonly lograda: boolean | null;
  readonly resultadoCentavos: Money | null;
  readonly cerradaAt: string | null;
}

/** The figure a goal's kind reads off a month's ledger. */
export function figuraDelMes(
  objetivo: ObjetivoMeta,
  totales: { readonly ventas: Money; readonly gastos: Money },
): Money {
  if (objetivo === 'vender') return totales.ventas;
  if (objetivo === 'gastar') return totales.gastos;
  return totales.ventas - totales.gastos;
}

/** The target: base ± the level's percentage, in integer centavos. */
export function objetivoDe(base: Money, nivel: NivelMeta, objetivo: ObjetivoMeta): Money {
  const pct = BigInt(NIVELES.find((n) => n.id === nivel)?.pct ?? 0);
  const signo = objetivo === 'gastar' ? -100n : 100n;
  return (base * (100n + (pct * signo) / 100n)) / 100n;
}

/** A goal is met when the month's figure is at least the target — or at most, for gastar. */
export function metaLograda(meta: Meta, resultado: Money): boolean {
  return meta.objetivo === 'gastar'
    ? resultado <= meta.objetivoCentavos
    : resultado >= meta.objetivoCentavos;
}

export type Ritmo = 'ahead' | 'onpace' | 'behind';

export interface RitmoMeta {
  readonly ritmo: Ritmo;
  /** Days ahead (positive) or behind (negative), at the month's linear pace. */
  readonly dias: number;
  /** What remains to reach the target, ≥ 0. */
  readonly faltante: Money;
}

/**
 * Pace against a straight line from zero to the target across the month.
 * A day counts when today is within the goal's period; before it, the pace
 * cannot be judged and reads as `onpace` with the whole target pending.
 */
export function ritmoDeMeta(meta: Meta, actual: Money, hoy: IsoDate): RitmoMeta {
  const [y, m] = meta.periodo.split('-').map(Number) as [number, number];
  const dias = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const transcurridos = Math.max(
    0,
    Math.round(
      (Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${meta.periodo}-01T00:00:00Z`)) / 86_400_000,
    ),
  );
  const esperado = (meta.objetivoCentavos * BigInt(Math.min(transcurridos, dias))) / BigInt(dias);
  const faltante = meta.objetivoCentavos - actual;
  const porDia = meta.objetivoCentavos / BigInt(dias);
  const diasDeDiferencia = Number((actual - esperado) / (porDia > 0n ? porDia : 1n));
  const ritmo: Ritmo =
    diasDeDiferencia >= 1 ? 'ahead' : diasDeDiferencia <= -1 ? 'behind' : 'onpace';
  return {
    ritmo,
    dias: Math.abs(Math.round(diasDeDiferencia)),
    faltante: faltante > 0n ? faltante : 0n,
  };
}

/** Goals met in consecutive months, counting back from the newest closed one. */
export function rachaDe(metasCerradas: readonly Meta[]): number {
  const ordenadas = [...metasCerradas].sort((a, b) => b.periodo.localeCompare(a.periodo));
  let racha = 0;
  let mesEsperado: string | null = ordenadas[0]?.periodo ?? null;
  for (const m of ordenadas) {
    if (m.periodo !== mesEsperado || m.lograda !== true) break;
    racha += 1;
    mesEsperado = mesPrevio(m.periodo);
  }
  return racha;
}

/** The streak milestones that earn a toast (P-33). */
export const HITOS_RACHA: readonly number[] = [3, 6, 12];

const mesPrevio = (ym: string): string => {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

/**
 * The out-of-range callout (P-27): a target beyond three times the base (or
 * under half of it) is not a goal, it is a wish — the CTA becomes
 * «Ajustar monto» instead of «Empezar mi meta».
 */
export function fueraDeRango(objetivo: Money, base: Money): boolean {
  if (base <= 0n) return false;
  return objetivo > base * 3n || objetivo < base / 2n;
}
