import type { FacturaRecibida } from '@xangarro/application/corp';
import { formatMoney, formatMonth } from '@xangarro/domain';
import { periodOf } from '@xangarro/domain/corp';

/**
 * «Registrar pago» on an invoice on credit (E-11, board CD-06e): what leaves
 * the bank and what turns creditable, the earliest day the payment can take,
 * and the closed-month answer in the founder's words.
 */
export interface MontoPago {
  readonly label: string;
  readonly value: string;
}

export interface PagoFactura {
  readonly uuid: string;
  /** `YYYY-MM-DD` of the invoice: no payment before it. */
  readonly desde: string;
  /** «30 de octubre». */
  readonly desdeTexto: string;
  readonly montos: readonly MontoPago[];
}

const mesDe = (fecha: string): string | null => {
  const periodo = periodOf(fecha);
  return periodo === null ? null : (formatMonth(periodo).split(' ')[0] ?? null);
};

/** «30 de octubre»; the ISO date itself when it is not one. */
export function diaDeMes(fecha: string): string {
  const mes = mesDe(fecha);
  return mes === null ? fecha : `${Number(fecha.slice(8, 10))} de ${mes}`;
}

export function pagoFactura(f: FacturaRecibida): PagoFactura {
  const c = f.cfdi;
  const retenido = c.retencionIsr + c.retencionIva;
  const montos: MontoPago[] = [
    { label: 'Sale del banco', value: formatMoney(c.total) },
    { label: 'IVA acreditable', value: formatMoney(c.iva) },
  ];
  if (retenido > 0n) montos.push({ label: 'Retenciones al SAT', value: formatMoney(retenido) });
  const desde = c.fecha.slice(0, 10);
  return { uuid: c.uuid, desde, desdeTexto: diaDeMes(desde), montos };
}

/** The ledger refused the payment date: its month is closed, or it is no date. */
export function mensajeMesCerrado(fecha: string): string {
  const mes = mesDe(fecha);
  if (mes === null) return 'Elige una fecha de pago válida.';
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ya está cerrado. Elige otra fecha de pago.`;
}
