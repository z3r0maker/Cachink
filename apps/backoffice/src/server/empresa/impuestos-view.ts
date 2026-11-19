import type { DocumentoMeta, LedgerEntry, ObligacionGuardada } from '@xangarro/application/corp';
import {
  compararConDeclaracion,
  mesMas,
  plantilla,
  PLANTILLA_IMPUESTOS,
  vencimiento,
  type ComparacionDelMes,
  type Declaracion,
  type EstimadoDelMes,
  type MesFiscal,
} from '@xangarro/domain/corp';

/**
 * Impuestos' month (E-13, board CD-09): its estimate, the contador's figures,
 * the Agenda's «ISR e IVA» and where the declaration stands. Pure; the page
 * and its parts word it from here.
 */
export interface DatosImpuestos {
  readonly mes: string;
  readonly hoy: string;
  /** Every month from the first to `mes`, oldest first. */
  readonly meses: readonly MesFiscal[];
  readonly estimados: readonly EstimadoDelMes[];
  readonly declaraciones: ReadonlyMap<string, Declaracion>;
  readonly obligaciones: ReadonlyMap<string, ObligacionGuardada>;
  /** The papers of the month on screen. */
  readonly papeles: readonly DocumentoMeta[];
  /** The ledger entry that paid the month on screen. */
  readonly pago: LedgerEntry | null;
}

export type EstadoMes = 'por_declarar' | 'diferencia' | 'preparada' | 'presentada' | 'pagada';

export interface MesImpuestos {
  readonly mes: string;
  readonly estimado: EstimadoDelMes;
  readonly declaracion: Declaracion | null;
  readonly obligacion: ObligacionGuardada | null;
  readonly comparacion: ComparacionDelMes;
  readonly estado: EstadoMes;
  /** The day it is due, `YYYY-MM-DD`, after CFF art. 12. */
  readonly vence: string;
}

const MES = /^\d{4}-(0[1-9]|1[0-2])$/;

/** The month on screen: the one declared this month unless the link names another. */
export function parseMesImpuestos(value: string | undefined, hoy: string): string {
  const actual = hoy.slice(0, 7);
  if (value !== undefined && MES.test(value) && value <= actual) return value;
  return mesMas(actual, -1);
}

export const hrefImpuestos = (mes: string, declarar = false): string =>
  `/empresa/impuestos?mes=${mes}${declarar ? '&declarar=1' : ''}`;

export const venceEl = (mes: string): string => {
  const p = plantilla(PLANTILLA_IMPUESTOS);
  if (p === undefined) throw new Error(`the catalog has no ${PLANTILLA_IMPUESTOS}`);
  return vencimiento(p.regla, mes).vence;
};

function estadoDe(o: ObligacionGuardada | null, d: Declaracion | null, c: ComparacionDelMes) {
  if (o?.estado === 'pagada') return 'pagada';
  if (d === null) return 'por_declarar';
  if (c.isr.revisar || c.iva.revisar || c.retenciones.revisar) return 'diferencia';
  return o?.estado === 'presentada' ? 'presentada' : 'preparada';
}

export function mesDe(d: DatosImpuestos, mes: string): MesImpuestos | null {
  const estimado = d.estimados.find((e) => e.mes === mes);
  if (estimado === undefined) return null;
  const declaracion = d.declaraciones.get(mes) ?? null;
  const obligacion = d.obligaciones.get(mes) ?? null;
  const comparacion = compararConDeclaracion(estimado, declaracion);
  const estado = estadoDe(obligacion, declaracion, comparacion);
  return { mes, estimado, declaracion, obligacion, comparacion, estado, vence: venceEl(mes) };
}

/** Nothing collected or paid, nothing declared: the empty state of board CD-09. */
export function sinMovimientos(d: DatosImpuestos, m: MesImpuestos): boolean {
  const f = d.meses.find((x) => x.mes === m.mes);
  const vacio =
    f === undefined ||
    [
      f.ingresos,
      f.deducciones,
      f.ivaTrasladado,
      f.ivaAcreditable,
      f.retencionIsr,
      f.retencionIva,
    ].every((v) => v === 0n);
  return vacio && m.declaracion === null && (m.obligacion?.estado ?? 'pendiente') === 'pendiente';
}
