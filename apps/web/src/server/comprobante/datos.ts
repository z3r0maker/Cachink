import 'server-only';

import { type Tx } from '../db';
import {
  getBusiness,
  logoPublico,
  ticketParaComprobante,
  ultimoTicketComprobante,
  type TicketComprobante,
} from '@xangarro/data-pg';
import {
  monograma,
  type Comprobante,
  type MetodoPagoComprobante,
  type NegocioComprobante,
  type PlantillaComprobante,
} from '@xangarro/domain';

/**
 * Venta + branding → the renderer's contract (N-20). Everything optional
 * is passed only when the business actually set it — a block that is off
 * never reaches the SVG. The direccion block waits for an address field
 * to exist (address_print is stored, but nothing feeds it yet).
 */

const ACENTO_POR_OMISION = '#FFD60A';
const METODO_DISPLAY: Record<string, MetodoPagoComprobante> = {
  Efectivo: 'Efectivo',
  Transferencia: 'Transferencia',
  Tarjeta: 'Tarjeta',
  'QR/CoDi': 'QR · CoDi',
  Crédito: 'Crédito',
};

export async function plantillaDelNegocio(tx: Tx): Promise<PlantillaComprobante> {
  const b = await getBusiness(tx);
  const t = b?.receiptTemplate ?? 'clasico';
  return t === 'moderno' || t === 'ticket' || t === 'minimal' ? t : 'clasico';
}

export async function negocioParaComprobante(tx: Tx): Promise<NegocioComprobante> {
  const b = await getBusiness(tx);
  const nombre = b?.nombre ?? 'Tu negocio';
  const logo = b === undefined ? null : await logoPublico(tx, b.id);
  return {
    nombre,
    logoDataUrl:
      logo === null ? undefined : `data:${logo.mime};base64,${logo.bytes.toString('base64')}`,
    monograma: monograma(nombre),
    whatsapp: b?.whatsapp ?? undefined,
    redes: primeraRed(b?.socialLinks),
    leyenda: b?.receiptLeyenda ?? undefined,
    acento: b?.brandColor ?? ACENTO_POR_OMISION,
  };
}

function primeraRed(json: string | null | undefined): string | undefined {
  if (json === null || json === undefined || json === '' || json === '{}') return undefined;
  try {
    const valores = Object.values(JSON.parse(json) as Record<string, unknown>);
    const primera = valores.find((v): v is string => typeof v === 'string' && v.trim() !== '');
    return primera === undefined ? undefined : primera.slice(0, 30);
  } catch {
    return undefined;
  }
}

/** A venta as the renderer wants it; null when the ticket does not exist. */
export async function comprobanteDeTicket(
  tx: Tx,
  ticketId: string,
): Promise<(Comprobante & { readonly cancelada: boolean }) | null> {
  const t = await ticketParaComprobante(tx, ticketId);
  if (t === null) return null;
  return { ...deTicket(t, await negocioParaComprobante(tx)), cancelada: t.cancelada };
}

/** The preview's venta: the business's own last ticket, or a demo one. */
export async function comprobanteDeMuestra(tx: Tx): Promise<Comprobante> {
  const negocio = await negocioParaComprobante(tx);
  const propia = await ultimoTicketComprobante(tx);
  return deTicket(propia ?? DEMO, negocio);
}

function deTicket(t: TicketComprobante, negocio: NegocioComprobante): Comprobante {
  return {
    negocio,
    folio: t.folio,
    fechaHora: t.fechaHora,
    conceptos: t.lineas.map((l) => ({
      concepto: l.concepto,
      cantidad: l.cantidad,
      importe: l.importe,
    })),
    total: t.total,
    metodoPago: METODO_DISPLAY[t.metodo] ?? 'Efectivo',
    mostrarMarcaXangarro: true,
  };
}

const DEMO: TicketComprobante = {
  folio: 'V-000128',
  fechaHora: '2026-09-14T14:32:00-06:00',
  metodo: 'Efectivo',
  total: 28500n,
  lineas: [
    { concepto: 'Orden de tacos al pastor', cantidad: 3, importe: 18000n },
    { concepto: 'Refresco 600 ml', cantidad: 2, importe: 6000n },
    { concepto: 'Consomé chico', cantidad: 1, importe: 4500n },
  ],
  cancelada: false,
};
