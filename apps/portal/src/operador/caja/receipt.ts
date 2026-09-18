import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { importe } from './ticket';
import type { VentaHecha } from './use-sale-toast';

/**
 * The simple receipt (CLAUDE.md §1 «comprobantes» — not a CFDI): business,
 * folio, lines, total, method and a thank-you line.
 */
export interface Comprobante {
  readonly negocio: string;
  readonly folio: string;
  readonly venta: VentaHecha;
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

const W = 720;
const LINE = 44;

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
