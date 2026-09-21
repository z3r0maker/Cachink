import { formatMoney, type Money } from '@xangarro/domain';

/**
 * The three WhatsApp message bodies (P-32), transcribed from the Asesor
 * design file's own `shareMessage` builder — money lands formatted, the
 * figures come from real data, and no message is ever invented.
 */

export type VarianteCompartir = 'diagnostico' | 'cobranza' | 'logro';

export interface DatosCompartir {
  readonly negocio: string;
  /** `YYYY-MM` — the month the message is about. */
  readonly mes: string;
  readonly ventas: Money;
  readonly utilidad: Money;
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

export const nombreDelMes = (ym: string): string => {
  const m = MESES[Number(ym.slice(5, 7)) - 1];
  return `${m ?? ym} ${ym.slice(0, 4)}`;
};

export function mensajeDiagnostico(d: DatosCompartir): string {
  return (
    `Le comparto el resumen de ${nombreDelMes(d.mes)} de ${d.negocio}: ` +
    `vendimos ${formatMoney(d.ventas)} y la utilidad fue de ${formatMoney(d.utilidad)}.`
  );
}

export function mensajeCobranza(d: {
  readonly cliente: string;
  readonly saldo: Money;
  readonly negocio: string;
}): string {
  return (
    `Hola ${d.cliente}, le recuerdo su saldo pendiente de ` +
    `${formatMoney(d.saldo)} en ${d.negocio}. ¡Gracias!`
  );
}

export function mensajeLogro(d: {
  readonly negocio: string;
  readonly mes: string;
  readonly vendido: Money;
}): string {
  return (
    `En ${nombreDelMes(d.mes)} vendimos ${formatMoney(d.vendido)} en ${d.negocio} ` +
    `y llegamos a nuestra meta del mes. ¡Gracias por venir!`
  );
}

/** The attachment the design file's chip names, per variant. */
export function archivoDe(v: VarianteCompartir, mes: string): string | null {
  if (v === 'diagnostico') return `Diagnóstico-${mes}.pdf`;
  if (v === 'logro') return `Meta-${mes}.png`;
  return null;
}
