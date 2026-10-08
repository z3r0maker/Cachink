/**
 * Régimen-aware ISR estimation (ADR-089, resolves finding F-2).
 *
 * The SAT publishes the tables; we apply them to the figures the portal
 * already computes, and every surface that shows the result carries the
 * reference disclaimer — the estimate is not a declaration.
 *
 *   - **RESICO persona física (626, Art. 113-E LISR):** a flat rate over
 *     **all** the month's gross income, by bracket — 1.00 % up to $25 K/mo
 *     rising to 2.50 % over $350 K/mo. This is the structural fix of F-2: the
 *     old model taxed profit, RESICO de personas físicas taxes income.
 *   - **RESICO persona moral (626, LISR Título VII Cap. XII, Art. 211):** the
 *     Art. 9 rate (30 %) over the year's cash-basis profit — ingresos
 *     efectivamente percibidos less deducciones efectivamente erogadas —
 *     crediting the earlier provisional payments. Utilidad operativa stands
 *     in for that profit (ADR-125); being cumulative, a multi-month period is
 *     one base, not a sum of months. 626 is valid for both personas, so the
 *     persona decides; when it is unknown (no RFC yet) the física table
 *     applies, as it did before the persona existed.
 *   - **PF Empresarial y Profesional (612, Art. 96 LISR via Anexo 8 RMF
 *     2026):** the progressive monthly tariff — fixed quota plus a marginal
 *     rate over the lower limit — applied to utilidad operativa as the
 *     proxy for the base gravable (personal deductions are not modelled;
 *     the disclaimer says so).
 *   - **Everything else** (RIF 621, Asalariados 605, moral régimes, none):
 *     the owner's own rate from Negocio on utilidad — exactly the behavior
 *     before this module existed.
 *
 * Tables verified against Anexo 8 RMF 2026 (DOF 28/12/2025) and Art. 113-E;
 * amounts are integer centavos, and the tariff's published decimals are kept
 * centavo-exact.
 */

import type { TipoPersona } from '../fiscal/rfc.js';
import type { Money } from '../money/index.js';
import { ZERO } from '../money/index.js';

export type IsrMetodo = 'resico' | 'resicoMoral' | 'tarifa96' | 'tasa';

export interface IsrPorRegimen {
  readonly isr: Money;
  readonly metodo: IsrMetodo;
  /** What the rate was applied to — named so the notice can say it. */
  readonly base: 'ingresos' | 'utilidad';
}

/** Art. 9 LISR: the personas morales' rate, in basis points (30 %). */
const TASA_PERSONAS_MORALES_BPS = 3_000n;

/** RESICO monthly brackets: flat rate over the whole gross amount (Art. 113-E). */
const RESICO: readonly { readonly hasta: Money | null; readonly tasaBps: number }[] = [
  { hasta: 2_500_000n, tasaBps: 100 },
  { hasta: 5_000_000n, tasaBps: 110 },
  { hasta: 8_333_333n, tasaBps: 150 },
  { hasta: 20_833_333n, tasaBps: 200 },
  { hasta: 35_000_000n, tasaBps: 225 },
  { hasta: null, tasaBps: 250 },
];

/** Art. 96 monthly tariff 2026 (Anexo 8 RMF): quota + marginal over the lower limit. */
const TARIFA96: readonly {
  readonly desde: Money;
  readonly cuota: Money;
  readonly tasaBps: number;
}[] = [
  { desde: 1n, cuota: 0n, tasaBps: 192 },
  { desde: 84_460n, cuota: 1_622n, tasaBps: 640 },
  { desde: 716_852n, cuota: 42_095n, tasaBps: 1_088 },
  { desde: 1_259_803n, cuota: 101_168n, tasaBps: 1_600 },
  { desde: 1_464_465n, cuota: 133_914n, tasaBps: 1_792 },
  { desde: 1_753_365n, cuota: 185_684n, tasaBps: 2_136 },
  { desde: 3_536_284n, cuota: 566_516n, tasaBps: 2_352 },
  { desde: 5_573_669n, cuota: 1_045_709n, tasaBps: 3_000 },
  { desde: 10_641_051n, cuota: 2_565_923n, tasaBps: 3_200 },
  { desde: 14_188_067n, cuota: 3_700_969n, tasaBps: 3_400 },
  { desde: 42_564_200n, cuota: 13_348_854n, tasaBps: 3_500 },
];

function fila96(mensual: Money): (typeof TARIFA96)[number] {
  let fila = TARIFA96[0]!;
  for (const f of TARIFA96) if (mensual >= f.desde) fila = f;
  return fila;
}

/** One month of RESICO: the bracket's flat rate over the whole amount. */
export function isrResicoMensual(ingresos: Money): Money {
  if (ingresos <= ZERO) return ZERO;
  const fila =
    RESICO.find((r) => r.hasta !== null && ingresos <= r.hasta) ?? RESICO[RESICO.length - 1]!;
  return (ingresos * BigInt(fila.tasaBps)) / 10_000n;
}

/** One month of the Art. 96 tariff: quota + marginal over the lower limit. */
export function isrTarifa96Mensual(base: Money): Money {
  if (base <= ZERO) return ZERO;
  const f = fila96(base);
  return f.cuota + ((base - f.desde + 1n) * BigInt(f.tasaBps)) / 10_000n;
}

/** The method a régime and persona are estimated with — the one routing rule. */
export function metodoIsr(
  regimenSat: string | null,
  persona: TipoPersona | null = null,
): IsrMetodo {
  if (regimenSat === '626') return persona === 'moral' ? 'resicoMoral' : 'resico';
  if (regimenSat === '612') return 'tarifa96';
  return 'tasa';
}

const positiva = (m: Money): Money => (m > ZERO ? m : ZERO);

/**
 * The period's ISR estimate. `meses` spreads a multi-month period across the
 * monthly tables (per-month base = total ÷ meses, ISR = monthly × meses) —
 * the standard approximation for a statement, not a declaration.
 */
export function calcularIsrPorRegimen(input: {
  readonly regimenSat: string | null;
  /** From the RFC (`tipoPersona`); only 626 depends on it. Absent: física. */
  readonly persona?: TipoPersona | null;
  readonly ingresos: Money;
  readonly utilidad: Money;
  readonly isrTasa: number;
  readonly meses?: number;
}): IsrPorRegimen {
  const meses = Math.max(1, Math.floor(input.meses ?? 1));
  const porMes = (total: Money): Money => total / BigInt(meses);
  const metodo = metodoIsr(input.regimenSat, input.persona ?? null);

  switch (metodo) {
    case 'resico':
      return {
        isr: isrResicoMensual(porMes(input.ingresos)) * BigInt(meses),
        metodo,
        base: 'ingresos',
      };
    case 'resicoMoral':
      return {
        isr: (positiva(input.utilidad) * TASA_PERSONAS_MORALES_BPS) / 10_000n,
        metodo,
        base: 'utilidad',
      };
    case 'tarifa96':
      return {
        isr: isrTarifa96Mensual(positiva(porMes(input.utilidad))) * BigInt(meses),
        metodo,
        base: 'utilidad',
      };
    case 'tasa':
      return {
        isr: (positiva(input.utilidad) * BigInt(input.isrTasa)) / 10_000n,
        metodo,
        base: 'utilidad',
      };
  }
}
