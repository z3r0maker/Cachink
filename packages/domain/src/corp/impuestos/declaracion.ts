import type { Money } from '../../money/index.js';
import type { PagoImpuestos } from '../ledger/movements.js';
import { esFecha } from '../servicios/validar.js';
import { DeclaracionInvalidaError } from './errors.js';
import type { EstimadoDelMes } from './estimado.js';

/**
 * What the contador declared for a month (E-13, board CD-09b): one federal
 * declaration with the ISR provisional, the IVA and both withholdings, and
 * the línea de captura it is paid with. Its acuse, línea and comprobante are
 * the evidence of the Agenda's «ISR e IVA» of that month.
 */
export interface Declaracion {
  /** `YYYY-MM`. */
  readonly periodo: string;
  readonly isr: Money;
  readonly iva: Money;
  readonly retencionIsr: Money;
  readonly retencionIva: Money;
  /** The línea de captura's amount, once the founders have it. */
  readonly lineaImporte: Money | null;
  /** The last day the línea can be paid, `YYYY-MM-DD`. */
  readonly lineaVigencia: string | null;
}

/** The Agenda template of the monthly declaration. */
export const PLANTILLA_IMPUESTOS = 'impuestos_mensual';

/** A difference over this flags «Revisa con el contador» (centavos). */
export const UMBRAL_DIFERENCIA = 100n;

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

function falla(cond: boolean, detalle: string): void {
  if (cond) throw new DeclaracionInvalidaError(detalle);
}

export function assertDeclaracion(d: Declaracion): void {
  falla(!MES.test(d.periodo), `«${d.periodo}» no es un mes`);
  for (const [nombre, v] of [
    ['el ISR', d.isr],
    ['el IVA', d.iva],
    ['el ISR retenido', d.retencionIsr],
    ['el IVA retenido', d.retencionIva],
  ] as const) {
    falla(v < 0n, `${nombre} no puede ser negativo`);
  }
  falla(d.lineaImporte !== null && d.lineaImporte <= 0n, 'el importe de la línea es mayor a cero');
  falla(
    d.lineaVigencia !== null && !esFecha(d.lineaVigencia),
    `«${d.lineaVigencia}» no es una fecha`,
  );
}

export const totalDeclarado = (d: Declaracion): Money =>
  d.isr + d.iva + d.retencionIsr + d.retencionIva;

/** The línea de captura says the amount declared, or has not been typed. */
export const lineaCuadra = (d: Declaracion): boolean =>
  d.lineaImporte === null || d.lineaImporte === totalDeclarado(d);

export interface Comparacion {
  readonly estimado: Money;
  readonly declarado: Money | null;
  /** Declared less estimated; null before the contador declares. */
  readonly diferencia: Money | null;
  readonly revisar: boolean;
}

function comparar(estimado: Money, declarado: Money | null): Comparacion {
  const diferencia = declarado === null ? null : declarado - estimado;
  const revisar =
    diferencia !== null && (diferencia > UMBRAL_DIFERENCIA || -diferencia > UMBRAL_DIFERENCIA);
  return { estimado, declarado, diferencia, revisar };
}

export interface ComparacionDelMes {
  readonly isr: Comparacion;
  readonly iva: Comparacion;
  readonly retenciones: Comparacion;
  readonly total: Comparacion;
}

export function compararConDeclaracion(
  e: EstimadoDelMes,
  d: Declaracion | null,
): ComparacionDelMes {
  return {
    isr: comparar(e.isr.aPagar, d?.isr ?? null),
    iva: comparar(e.iva.aPagar, d?.iva ?? null),
    retenciones: comparar(e.retenciones.total, d === null ? null : d.retencionIsr + d.retencionIva),
    total: comparar(e.total, d === null ? null : totalDeclarado(d)),
  };
}

/** The ledger entry's idempotency key: one payment per declared month. */
export const refPagoImpuestos = (periodo: string): string => `impuestos:${periodo}`;

/** The payment of a declaration, or null when it was declared en ceros. */
export function pagoDeDeclaracion(d: Declaracion): PagoImpuestos | null {
  if (totalDeclarado(d) === 0n) return null;
  return {
    kind: 'pago_impuestos',
    isr: d.isr,
    iva: d.iva,
    retenciones: d.retencionIsr + d.retencionIva,
  };
}
