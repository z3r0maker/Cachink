import { colors } from '@xangarro/tokens';

import type { ComprobantesForm } from '@/server/actions/comprobantes';

/**
 * What the live preview paints (CfgComprobantes): the unsaved form over a
 * demo venta, so every change shows before it is saved. The downloads come
 * from the server renderer and the saved branding instead.
 */
export type Plantilla = ComprobantesForm['receiptTemplate'];

export interface Marca {
  readonly nombre: string;
  readonly iniciales: string;
  readonly logoUrl: string | null;
  readonly form: ComprobantesForm;
}

export const VENTA = {
  folio: 'V-2098',
  hora: '09:02 h',
  producto: 'Quesadilla',
  cantidad: 5,
  unitario: '$40.00',
  importe: '$200.00',
  total: '$200.00',
  metodo: 'Efectivo',
  recibido: '$250.00',
  cambio: '$50.00',
} as const;

export const NO_FISCAL = 'Este documento no es un comprobante fiscal (CFDI).';

/** «26 de septiembre de 2026». */
export const fechaLarga = (d: Date = new Date()): string =>
  new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);

export const HEX = /^#[0-9a-fA-F]{6}$/;

/** Black or white ink, whichever reads on the brand colour. */
export function tinta(hex: string): string {
  if (!HEX.test(hex)) return colors.black;
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l > 0.3 ? colors.black : colors.white;
}

/** The address shows only when the switch is on AND a line exists (0028). */
export const direccionVisible = (f: ComprobantesForm): string | null =>
  f.addressPrint && f.direccion.trim() !== '' ? f.direccion.trim() : null;

export const TEMPLATES: readonly {
  readonly id: Plantilla;
  readonly titulo: string;
  readonly desc: string;
}[] = [
  { id: 'ticket', titulo: 'Ticket', desc: 'Recomendado · así llega por WhatsApp' },
  { id: 'clasico', titulo: 'Clásico', desc: 'Bordes marcados, todo visible.' },
  { id: 'moderno', titulo: 'Moderno', desc: 'Aire, jerarquía y tu color.' },
  { id: 'minimal', titulo: 'Minimal', desc: 'Solo lo esencial.' },
];
