import type { EstadoSat } from '@xangarro/domain/corp';
import type { FacturaDelMes } from '@xangarro/data-corp';

import { porPagar } from './factura-estado';
import { pagoFactura, type PagoFactura } from './pago-factura-view';

/**
 * The «Estado SAT» column beyond its tag (E-11, board CD-06g): «Consultar al
 * SAT» on a registered invoice the SAT did not answer for, «El SAT la confirmó
 * hoy» right after it did, and the warning under a registered invoice the SAT
 * says the supplier cancelled. Cancelling it is a founder's (CD-06f).
 */
export type SatFila =
  | { readonly tipo: 'nada' }
  | { readonly tipo: 'consultar'; readonly uuid: string; readonly mes: string }
  | { readonly tipo: 'confirmada' }
  /** `cancelable` while still owed; a paid one is only warned about. */
  | { readonly tipo: 'aviso'; readonly pago: PagoFactura; readonly cancelable: boolean };

/** Registered, its expense still standing, and the SAT says it was cancelled. */
export const canceladaEnSat = (d: FacturaDelMes): boolean =>
  d.factura.estado === 'registrada' && d.factura.estadoSat === 'cancelado' && !d.revertida;

/** `consultada`: the UUID just asked about, from the page's address. */
export function satFila(d: FacturaDelMes, consultada: string | null): SatFila {
  const f = d.factura;
  if (f.estado !== 'registrada') return { tipo: 'nada' };
  if (f.estadoSat === 'sin_verificar') {
    return { tipo: 'consultar', uuid: f.cfdi.uuid, mes: f.cfdi.fecha.slice(0, 7) };
  }
  if (canceladaEnSat(d)) return { tipo: 'aviso', pago: pagoFactura(f), cancelable: porPagar(d) };
  return f.estadoSat === 'vigente' && f.cfdi.uuid === consultada
    ? { tipo: 'confirmada' }
    : { tipo: 'nada' };
}

/** Why the invoice is still unverified; null once the SAT answered. */
export function mensajeConsultaSat(estado: EstadoSat): string | null {
  if (estado === 'sin_respuesta') return 'El SAT no respondió. Intenta en unos minutos.';
  if (estado === 'no_encontrado') return 'El SAT todavía no la encuentra. Intenta mañana.';
  return null;
}
