/**
 * The Comprobante contract (N-20) — the single object all four templates
 * render, transcribed from the design handoff. Everything optional is
 * independently toggleable; a template never invents content the caller
 * did not pass. Montos are Money (bigint centavos); formatting is
 * presentation and lives with the renderers.
 */

import type { Money } from '../money/index.js';

export type PlantillaComprobante = 'clasico' | 'moderno' | 'ticket' | 'minimal';

/** The handoff's labels; 'QR · CoDi' is the display form of the enum's 'QR/CoDi'. */
export type MetodoPagoComprobante =
  | 'Efectivo'
  | 'Transferencia'
  | 'Tarjeta'
  | 'QR · CoDi'
  | 'Crédito';

export interface ConceptoComprobante {
  readonly concepto: string;
  readonly cantidad: number;
  readonly importe: Money;
}

export interface NegocioComprobante {
  readonly nombre: string;
  /** Logo as a data URL the SVG can embed; absent for most businesses. */
  readonly logoDataUrl?: string;
  /** Two letters when there is no logo (see monograma). */
  readonly monograma?: string;
  readonly direccion?: string;
  readonly whatsapp?: string;
  /** One line, e.g. "@tacosdonacuca". */
  readonly redes?: string;
  readonly leyenda?: string;
  /** Single brand hex; the only colour that flows through the frame. */
  readonly acento: string;
}

export interface Comprobante {
  readonly negocio: NegocioComprobante;
  readonly folio: string;
  readonly fechaHora: string;
  /** 1–3; longer lists are truncated by the caller before they get here. */
  readonly conceptos: readonly ConceptoComprobante[];
  readonly total: Money;
  readonly metodoPago: MetodoPagoComprobante;
  readonly mostrarMarcaXangarro: boolean;
}

/** Destination-driven rendering: WhatsApp PNG floats on the off-white
 * canvas with the hard shadow; print fills the page flat, no shadow, and
 * Clásico/Moderno pad to the media-carta proportion. */
export type DestinoComprobante = 'whatsapp' | 'impresion';

export interface OpcionesRender {
  readonly destino?: DestinoComprobante;
}
