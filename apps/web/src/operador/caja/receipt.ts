import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { readDevice } from '../runtime/device-store';
import { importe } from './ticket';
import type { VentaHecha } from './use-sale-toast';

/**
 * The simple receipt (CLAUDE.md §1 «comprobantes», not a CFDI): business,
 * folio, when, lines, total, how it was paid and a thank-you line. `ticketId`
 * rides along on a linked register so the branded N-20 PNG can be fetched.
 */
export interface Comprobante {
  readonly negocio: string;
  readonly folio: string;
  readonly venta: VentaHecha;
  readonly ticketId?: string;
  /** «14:52»; now when absent (a sale just made). */
  readonly hora?: string;
  /** «Caja 1 · Ana», when the screen knows it. */
  readonly caja?: string;
}

export const GRACIAS = 'Gracias por su compra';
export const HECHO_CON = 'Hecho con Xangarro!';

/** «14 de mayo de 2026». */
export function fechaLarga(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

export function horaDe(c: Comprobante): string {
  if (c.hora !== undefined) return c.hora;
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

export const piezas = (c: Comprobante): number => c.venta.lines.reduce((n, l) => n + l.cantidad, 0);

/** How it was paid, as the receipt's last rows say it. */
export function pagoFilas(
  c: Comprobante,
  cliente?: string,
): readonly (readonly [string, string])[] {
  const { venta } = c;
  if (venta.cambio !== null)
    return [
      ['Efectivo', formatMoney(venta.total + venta.cambio)],
      ['Cambio', formatMoney(venta.cambio)],
    ];
  if (cliente !== undefined && cliente !== '') return [['A cuenta de', cliente]];
  return [[venta.metodo, formatMoney(venta.total)]];
}

/** A line's amount; a line the drawer only knows by pieces (no price) has none. */
export function importeTexto(l: VentaHecha['lines'][number]): string {
  const i = importe(l);
  return i === 0n ? '' : formatMoney(i);
}

export function receiptText(c: Comprobante, cliente?: string): string {
  const lines = c.venta.lines.map((l) =>
    `${l.cantidad} x ${l.nombre} ${importeTexto(l)}`.trimEnd(),
  );
  const pago = pagoFilas(c, cliente).map(([k, v]) => `${k}: ${v}`);
  return [
    c.negocio,
    `Venta ${c.folio} · ${fechaLarga()}, ${horaDe(c)} h`,
    '',
    ...lines,
    '',
    `Total: ${formatMoney(c.venta.total)}`,
    pago.join(' · '),
    '',
    GRACIAS,
    HECHO_CON,
  ].join('\n');
}

/** Ten digits make a Mexican mobile; WhatsApp needs the country code (52). */
export const digits = (tel: string) => tel.replace(/\D/g, '');

/** With a number, straight to that chat; without one, WhatsApp asks for the contact. */
export function whatsappUrl(tel: string, c: Comprobante, cliente?: string): string {
  const n = digits(tel);
  const text = encodeURIComponent(receiptText(c, cliente));
  return n === '' ? `https://wa.me/?text=${text}` : `https://wa.me/52${n}?text=${text}`;
}

/** N-21: the phone is remembered per cliente, or the last one used. */
const TEL_KEY = 'xg-share-tel';

export function leerTelefono(cliente?: string): string {
  try {
    const raw = localStorage.getItem(cliente === undefined ? TEL_KEY : `${TEL_KEY}:${cliente}`);
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
}

export function recordarTelefono(tel: string, cliente?: string): void {
  try {
    const limpio = tel.trim();
    if (limpio === '') return;
    localStorage.setItem(TEL_KEY, limpio);
    if (cliente !== undefined && cliente !== '')
      localStorage.setItem(`${TEL_KEY}:${cliente}`, limpio);
  } catch {
    /* sin localStorage no se recuerda; compartir sigue funcionando */
  }
}

const GUARDADA = 'Se guardó la imagen del comprobante en esta caja.';
const W = 720;
const LINE = 44;

/**
 * «Guardar imagen» (N-21): the branded comprobante in the business's chosen
 * template when the register is linked and online; the local canvas PNG
 * otherwise, so a sale just captured offline still shares.
 */
export async function guardarImagen(c: Comprobante): Promise<string> {
  const device = readDevice();
  if (c.ticketId !== undefined && device !== null && navigator.onLine) {
    try {
      const res = await fetch(`/api/v1/comprobante?ticketId=${encodeURIComponent(c.ticketId)}`, {
        headers: { authorization: `Bearer ${device.deviceToken}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `comprobante-${c.folio}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        return GUARDADA;
      }
    } catch {
      /* sin red a mitad del camino: el canvas de abajo nunca falla */
    }
  }
  downloadReceiptPng(c);
  return GUARDADA;
}

/** Draws the receipt to a PNG at 2× and downloads it as comprobante-<folio>.png. */
export function downloadReceiptPng(c: Comprobante): void {
  const text = receiptText(c).split('\n');
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = 80 + text.length * LINE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = colors.white;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.black;
  text.forEach((row, i) => {
    ctx.font = `${i === 0 ? 800 : 700} 28px ui-monospace, Menlo, monospace`;
    ctx.fillText(row, 40, 70 + i * LINE);
  });
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `comprobante-${c.folio}.png`;
  a.click();
}
