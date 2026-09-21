import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { readDevice } from '../runtime/device-store';
import { importe } from './ticket';
import type { VentaHecha } from './use-sale-toast';

/**
 * The simple receipt (CLAUDE.md §1 «comprobantes» — not a CFDI): business,
 * folio, lines, total, method and a thank-you line. `ticketId` rides along
 * on a linked register so the branded N-20 PNG can be fetched when online.
 */
export interface Comprobante {
  readonly negocio: string;
  readonly folio: string;
  readonly venta: VentaHecha;
  readonly ticketId?: string;
}

export const GRACIAS = '¡Gracias por su compra!';

export function receiptText({ negocio, folio, venta }: Comprobante): string {
  const lines = venta.lines.map((l) => `${l.cantidad}× ${l.nombre} ${formatMoney(importe(l))}`);
  return [
    `${negocio} · ${folio}`,
    ...lines,
    `Total ${formatMoney(venta.total)} · ${venta.metodo}`,
    GRACIAS,
  ].join('\n');
}

/** Ten digits make a Mexican mobile; WhatsApp needs the country code (52). */
export const digits = (tel: string) => tel.replace(/\D/g, '');

export function whatsappUrl(tel: string, c: Comprobante): string {
  return `https://wa.me/52${digits(tel)}?text=${encodeURIComponent(receiptText(c))}`;
}

/** N-21: the phone is remembered per cliente — or the last one used. */
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

const W = 720;
const LINE = 44;

/**
 * «Guardar imagen» (N-21): the branded comprobante in the business's chosen
 * template when the register is linked and online; the local canvas PNG
 * otherwise — a sale just captured offline still shares.
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
        return `Imagen guardada como comprobante-${c.folio}.png.`;
      }
    } catch {
      /* sin red a mitad del camino: el canvas de abajo nunca falla */
    }
  }
  downloadReceiptPng(c);
  return `Imagen guardada como comprobante-${c.folio}.png.`;
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
    ctx.font = `${i === 0 ? 800 : 700} 28px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(row, 40, 70 + i * LINE);
  });
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `comprobante-${c.folio}.png`;
  a.click();
}
