import type { CategoriaGasto } from '../ledger/accounts.js';
import type { Gasto, PagoProveedor } from '../ledger/movements.js';
import type { CfdiRecibido } from './cfdi.js';

/**
 * What happens to an uploaded invoice (E-11, board CD-06c). It is ready to
 * register, or it is set aside with a reason the board words. A cancelled
 * one is kept, flagged, and posts nothing.
 */
export type EstadoSat = 'vigente' | 'cancelado' | 'no_encontrado' | 'sin_respuesta';

export type Revision =
  | { readonly tipo: 'lista'; readonly verificada: boolean }
  | { readonly tipo: 'cancelada' }
  | { readonly tipo: 'rechazada'; readonly motivo: 'otro_rfc' | 'ya_registrada' | 'no_encontrada' };

/** Checks that need no SAT call: an invoice to another RFC, or one MEXIA already has. */
export function revisarAntesDelSat(
  c: CfdiRecibido,
  ctx: { readonly rfcMexia: string; readonly yaRegistrada: boolean },
): Revision | null {
  if (c.receptor.rfc !== ctx.rfcMexia.toUpperCase())
    return { tipo: 'rechazada', motivo: 'otro_rfc' };
  if (ctx.yaRegistrada) return { tipo: 'rechazada', motivo: 'ya_registrada' };
  return null;
}

/**
 * The SAT's answer. Not found is refused (a fresh invoice can take a few
 * days to appear); no answer lets the founder go on, marked unverified.
 */
export function revisarConSat(estado: EstadoSat): Revision {
  switch (estado) {
    case 'vigente':
      return { tipo: 'lista', verificada: true };
    case 'cancelado':
      return { tipo: 'cancelada' };
    case 'no_encontrado':
      return { tipo: 'rechazada', motivo: 'no_encontrada' };
    default:
      return { tipo: 'lista', verificada: false };
  }
}

/** The expense a received invoice posts: paid when PUE, owed when PPD. */
export function gastoDeCfdi(
  c: Pick<CfdiRecibido, 'subtotal' | 'iva' | 'retencionIsr' | 'retencionIva' | 'metodoPago'>,
  categoria: CategoriaGasto,
): Gasto {
  return {
    kind: 'gasto',
    categoria,
    subtotal: c.subtotal,
    iva: c.iva,
    tratamientoIva: c.iva > 0n ? 'acreditable' : 'exento',
    retencionIsr: c.retencionIsr,
    retencionIva: c.retencionIva,
    pagado: c.metodoPago === 'PUE',
  };
}

/** Paying an invoice on credit: what its posting left owed and pending. */
export function pagoDeGasto(g: Gasto): PagoProveedor {
  const acreditable = g.tratamientoIva === 'acreditable';
  return {
    kind: 'pago_proveedor',
    total: g.subtotal + g.iva,
    ivaPorAcreditar: acreditable ? g.iva : 0n,
    retencionIsr: g.retencionIsr,
    retencionIva: g.retencionIva,
  };
}

/** `source_ref`s of an invoice's entries: its expense is its UUID, its payment `<uuid>:pago`. */
export const refFactura = (uuid: string): string => uuid;
export const refPagoFactura = (uuid: string): string => `${uuid}:pago`;
