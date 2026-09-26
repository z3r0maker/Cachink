import type { EstadoDeResultados, Money } from '@xangarro/domain';

import { waterfallDeResultados } from './charts-data';

/**
 * The numbers beside the Resultados cascade (ADR-107), pure so a test pins
 * them: the month's break-even, two margins in whole percents, and the
 * biggest thing that took money — Don Cuentas's line.
 */

/** Each cascade step as the owner says it; the NIF name stays in the statement. */
export const DICHO: Readonly<Record<string, { readonly label: string; readonly nota?: string }>> = {
  Ingresos: { label: 'Lo que vendiste' },
  'Costo de ventas': { label: 'Costo de lo vendido' },
  'Utilidad bruta': { label: 'Utilidad bruta' },
  Merma: { label: 'Se echó a perder o se dañó', nota: 'merma' },
  'Gastos operativos': { label: 'Gastos de operación' },
  'Utilidad operativa': { label: 'Utilidad de operación' },
  ISR: { label: 'ISR referencial' },
  'Utilidad neta': { label: 'Te quedó' },
};

export const dicho = (label: string): string => DICHO[label]?.label ?? label;

export interface ParaNoPerder {
  /** Sales that cover the month's gastos and merma at today's gross margin. */
  readonly meta: Money;
  readonly llevas: Money;
  readonly faltan: Money;
  /** 0–100, whole. */
  readonly avance: number;
}

const CIEN_PESOS = 10_000n;

/**
 * Break-even = (gastos operativos + merma) ÷ margen bruto, rounded up to the
 * next $100: a round number to aim for, never one that falls short. No
 * margin, nothing to cover, or nothing sold → null (the tile hides).
 */
export function paraNoPerder(er: EstadoDeResultados): ParaNoPerder | null {
  const fijos = er.gastosOperativos + er.merma;
  if (er.ingresos <= 0n || er.utilidadBruta <= 0n || fijos <= 0n) return null;
  const exacta = (fijos * er.ingresos + er.utilidadBruta - 1n) / er.utilidadBruta;
  const meta = ((exacta + CIEN_PESOS - 1n) / CIEN_PESOS) * CIEN_PESOS;
  const faltan = meta > er.ingresos ? meta - er.ingresos : 0n;
  const avance = er.ingresos >= meta ? 100 : Number((er.ingresos * 100n) / meta);
  return { meta, llevas: er.ingresos, faltan, avance };
}

const pct = (parte: Money, total: Money): number | null =>
  total === 0n ? null : Math.round((Number(parte) / Number(total)) * 100);

export function margenes(er: EstadoDeResultados): {
  readonly bruto: number | null;
  readonly operacion: number | null;
} {
  return {
    bruto: pct(er.utilidadBruta, er.ingresos),
    operacion: pct(er.utilidadOperativa, er.ingresos),
  };
}

/** The largest drop in the cascade — where Don points first. */
export function mayorGolpe(
  er: EstadoDeResultados,
): { readonly label: string; readonly monto: Money } | null {
  const restas = waterfallDeResultados(er).filter((s) => s.kind === 'resta');
  if (restas.length === 0) return null;
  const mayor = restas.reduce((a, b) => (b.monto > a.monto ? b : a));
  return { label: dicho(mayor.label), monto: mayor.monto };
}
