import { EvidenciaFaltanteError, TransicionInvalidaError } from './errors.js';
import type { Estado, Paso, Plantilla, TipoEvidencia } from './obligaciones.js';

/**
 * An obligation moves pendiente → preparada → presentada → pagada, through
 * the steps its template has (E-04). Nothing is marked presentada without its
 * acuse, nor pagada without its proof of payment (canvas round 2): the
 * evidence is the rule, not a reminder. A declaration with nothing to pay is
 * closed «sin pago», which its acuse already shows.
 */
export const NOMBRE_EVIDENCIA: Record<TipoEvidencia, string> = {
  acuse: 'el acuse',
  linea_captura: 'la línea de captura',
  comprobante_pago: 'el comprobante de pago',
  opinion_32d: 'la opinión del SAT',
  captura: 'la captura de la revisión',
  otro: 'el documento',
};

const ORDEN: readonly Estado[] = ['pendiente', 'preparada', 'presentada', 'pagada'];

/** The template's last step: once there, the obligation is done. */
export function estaCumplida(p: Plantilla, estado: Estado): boolean {
  return estado === p.pasos[p.pasos.length - 1];
}

/** The steps a founder can take from `actual`; «preparada» may be skipped. */
export function siguientesPasos(p: Plantilla, actual: Estado): readonly Paso[] {
  const desde = ORDEN.indexOf(actual);
  const posibles = p.pasos.filter((paso) => ORDEN.indexOf(paso) > desde);
  const primero = posibles[0];
  if (primero === undefined) return [];
  return primero === 'preparada' && posibles[1] !== undefined ? [primero, posibles[1]] : [primero];
}

export interface Transicion {
  readonly actual: Estado;
  readonly nuevo: Paso;
  /** The kinds of evidence already attached to this instance. */
  readonly evidencias: ReadonlySet<TipoEvidencia>;
  /** Paid with nothing to pay: the acuse shows $0. Only for «pagada». */
  readonly sinPago?: boolean;
}

export function assertTransicion(p: Plantilla, t: Transicion): void {
  if (!siguientesPasos(p, t.actual).includes(t.nuevo)) {
    throw new TransicionInvalidaError(t.actual, t.nuevo);
  }
  const falta = p.evidencia[t.nuevo];
  if (falta === undefined || t.evidencias.has(falta)) return;
  if (t.nuevo === 'pagada' && t.sinPago === true) return;
  throw new EvidenciaFaltanteError(NOMBRE_EVIDENCIA[falta]);
}
