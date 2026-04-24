/**
 * buildComprobanteHtml — pure HTML renderer for share comprobantes.
 *
 * Phase 1C-M3-T04. The "Compartir comprobante" action on any Venta card
 * generates a small HTML document (used as PNG on RN via view-shot, and
 * as PDF on desktop via html2canvas + save). This module lives in the
 * domain layer — no DOM, no React, no IO — so the serialization is
 * deterministic and trivially testable without a renderer.
 *
 * The output is a self-contained HTML document with inline CSS that
 * mirrors the Cachink brand: Plus Jakarta Sans, black hard border,
 * 4px hard drop shadow, yellow emphasis. The consumer embeds it into
 * an offscreen iframe / WebView to rasterize.
 *
 * Placeholders never reach the render — caller passes the active
 * Business and the Sale to serialize.
 */

import type { Business } from '../entities/business.js';
import type { Sale } from '../entities/sale.js';
import { formatMoney } from '../format/money.js';
import { formatDate } from '../format/date.js';

const BRAND_YELLOW = '#FFD60A';
const BRAND_BLACK = '#0D0D0D';
const BRAND_INK = '#1A1A18';
const BRAND_GRAY = '#5A5A56';
const BRAND_WHITE = '#FFFFFF';

/** Minimal HTML escape. Sufficient for the fields we render (no attrs). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface BuildComprobanteOptions {
  readonly sale: Sale;
  readonly business: Business;
  /** Override the default "¡Gracias por su compra!" footer. */
  readonly thankYou?: string;
  /** Override the fecha/metodo/credito labels for localization. */
  readonly labels?: {
    readonly comprobante: string;
    readonly fecha: string;
    readonly metodo: string;
    readonly credito: string;
  };
}

const DEFAULT_LABELS = {
  comprobante: 'Comprobante',
  fecha: 'Fecha',
  metodo: 'Método',
  credito: 'Pendiente de pago',
} as const;

const DEFAULT_THANK_YOU = '¡Gracias por su compra!';

/**
 * Render the comprobante HTML. Output is a single `<!doctype html>…
 * </html>` string so consumers can pipe it directly into an iframe /
 * WebView without extra wrapping.
 */
export function buildComprobanteHtml(options: BuildComprobanteOptions): string {
  const { sale, business } = options;
  const labels = options.labels ?? DEFAULT_LABELS;
  const thankYou = options.thankYou ?? DEFAULT_THANK_YOU;
  const creditoBadge =
    sale.estadoPago === 'pendiente' ? `<div class="badge">${escapeHtml(labels.credito)}</div>` : '';
  return `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"/><title>${escapeHtml(labels.comprobante)}</title>
<style>
  * { box-sizing: border-box; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  body { margin: 0; padding: 24px; background: ${BRAND_WHITE}; color: ${BRAND_INK}; }
  .card { max-width: 360px; margin: 0 auto; border: 2.5px solid ${BRAND_BLACK}; border-radius: 22px;
          box-shadow: 4px 4px 0 ${BRAND_BLACK}; padding: 28px 24px; background: ${BRAND_WHITE}; }
  .brand { display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK};
           border: 2px solid ${BRAND_BLACK}; border-radius: 10px; padding: 6px 10px; font-weight: 900;
           font-size: 14px; letter-spacing: -0.02em; text-transform: uppercase; }
  .title { font-weight: 900; font-size: 26px; letter-spacing: -0.03em; margin: 18px 0 6px; color: ${BRAND_BLACK}; }
  .muted { color: ${BRAND_GRAY}; font-weight: 600; font-size: 12px; letter-spacing: 0.05em;
           text-transform: uppercase; }
  .row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 12px; }
  .monto { font-weight: 900; font-size: 38px; letter-spacing: -0.04em; color: ${BRAND_BLACK}; }
  .badge { display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK};
           border: 2px solid ${BRAND_BLACK}; border-radius: 8px; padding: 4px 8px; font-weight: 700;
           font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 12px; }
  .foot { margin-top: 24px; text-align: center; font-weight: 700; color: ${BRAND_BLACK}; }
</style></head>
<body><section class="card">
  <div class="brand">${escapeHtml(business.nombre)}</div>
  <div class="title">${escapeHtml(sale.concepto)}</div>
  <div class="muted">${escapeHtml(labels.fecha)} · ${escapeHtml(formatDate(sale.fecha))}</div>
  <div class="row"><span class="muted">${escapeHtml(labels.metodo)}</span><span class="muted">${escapeHtml(sale.metodo)}</span></div>
  <div class="row"><span class="monto">${escapeHtml(formatMoney(sale.monto))}</span></div>
  ${creditoBadge}
  <div class="foot">${escapeHtml(thankYou)}</div>
</section></body></html>`;
}
