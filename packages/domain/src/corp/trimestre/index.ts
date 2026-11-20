import type { Money } from '../../money/index.js';
import type { MovimientoCajaConTipo } from '../caja/proyeccion.js';
import { rangoDelTrimestre, trimestreAnterior, ultimoDiaDelTrimestre } from '../socios/dinero.js';

/**
 * Socios › Trimestre (E-17, board CD-17b): what the quarter summary computes
 * beyond what Resultados, Caja and the Tablero already do. Figures only (owner
 * decision 2026-11-20): no written headline until the analista de cierre (E-32).
 */

/** Growth against the previous figure, in whole percent; null («sin base») without a positive base. */
export function crecimiento(actual: Money, anterior: Money): number | null {
  if (anterior <= 0n) return null;
  const d = (actual - anterior) * 200n;
  const r = d >= 0n ? (d + anterior) / (anterior * 2n) : -((-d + anterior) / (anterior * 2n));
  return Number(r);
}

/** The last `n` quarters up to `trimestre`, oldest first. */
export function trimestresHasta(trimestre: string, n: number): string[] {
  const out = [trimestre];
  while (out.length < n) out.unshift(trimestreAnterior(out[0] ?? trimestre));
  return out;
}

export type EstadoDelResumen = 'cerrado' | 'en_curso' | 'futuro';

/** A closed quarter runs to its last day; the one in progress to today. */
export function rangoDelResumen(
  trimestre: string,
  hoy: string,
): { readonly desde: string; readonly hasta: string; readonly estado: EstadoDelResumen } {
  const [desde] = rangoDelTrimestre(trimestre);
  const ultimo = ultimoDiaDelTrimestre(trimestre);
  if (hoy < desde) return { desde, hasta: ultimo, estado: 'futuro' };
  if (hoy > ultimo) return { desde, hasta: ultimo, estado: 'cerrado' };
  return { desde, hasta: hoy, estado: 'en_curso' };
}

/**
 * The partners' money put in (capital, AFAC, loans: cash in that touches a
 * partner account) and the taxes paid, between two days inclusive.
 */
export function dineroDelRango(
  movs: readonly Pick<MovimientoCajaConTipo, 'fecha' | 'importe' | 'socios' | 'kind'>[],
  desde: string,
  hasta: string,
): { readonly aportado: Money; readonly impuestos: Money } {
  let aportado = 0n;
  let impuestos = 0n;
  for (const m of movs) {
    if (m.fecha < desde || m.fecha > hasta) continue;
    if (m.socios && m.importe > 0n) aportado += m.importe;
    if (m.kind === 'pago_impuestos') impuestos -= m.importe;
  }
  return { aportado, impuestos };
}
