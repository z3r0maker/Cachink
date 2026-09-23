/**
 * Shared pieces of the four receipt SVG renderers (N-20): the canvas and
 * hard-shadow card scaffold, <text> emission, character-count wrapping
 * (the fichas size by characters, not measured widths), es-MX money and
 * date formatting, and the payment pill palette. Pure string work.
 */

import { escapeHtml } from '../build-comprobante-html.js';
import type { MetodoPagoComprobante } from '../datos.js';
export { cajaLogo } from './logo.js';
import { formatMoney } from '../../format/money.js';
import type { Money } from '../../money/index.js';

export const FUENTE_SANS = 'Plus Jakarta Sans';
export const FUENTE_MONO = 'JetBrains Mono';

/** Tokens that the fichas repeat verbatim (see design-reference/comprobantes). */
export const NEGRO = '#0D0D0D';
export const INK = '#1A1A18';
export const GRAY600 = '#5A5A56';
export const GRAY400 = '#9E9E9A';
export const GRAY200 = '#E4E4E0';
export const BLANCO = '#FFFFFF';
export const FONDO_APP = '#F7F7F5';

/** The artboards' pastel per method; Tarjeta is the one inferred value. */
export const PASTEL_METODO: Record<MetodoPagoComprobante, string> = {
  Efectivo: '#FFFBCC',
  Transferencia: '#E5ECFF',
  Tarjeta: '#FFF8E1',
  'QR · CoDi': '#D6FFF4',
  Crédito: '#FFE8EA',
};

export const MARGEN_WHATSAPP = 12;

/**
 * The house's two hard drops: `4px 4px 0` for a card, `5px 5px 0` for a hero.
 * The templates split the same way — Clásico and Moderno are hero-sized,
 * Ticket and Minimal are cards, which is what their artboards draw.
 */
export const SOMBRA = 5;
export const SOMBRA_TARJETA = 4;

export interface EstiloTexto {
  readonly tamano: number;
  readonly peso?: number;
  readonly mono?: boolean;
  readonly fill?: string;
  readonly ancla?: 'start' | 'middle' | 'end';
  readonly espaciado?: number;
}

/** One SVG <text>. x/y are the baseline point. */
export function texto(x: number, y: number, contenido: string, s: EstiloTexto): string {
  const familia = s.mono === true ? FUENTE_MONO : FUENTE_SANS;
  const attrs = [
    `x="${x}"`,
    `y="${y}"`,
    `font-family="${familia}"`,
    `font-size="${s.tamano}"`,
    `font-weight="${s.peso ?? 400}"`,
    `fill="${s.fill ?? NEGRO}"`,
    s.ancla === undefined ? '' : `text-anchor="${s.ancla}"`,
    s.espaciado === undefined ? '' : `letter-spacing="${s.espaciado}"`,
  ]
    .filter((a) => a !== '')
    .join(' ');
  return `<text ${attrs}>${escapeHtml(contenido)}</text>`;
}

/**
 * Wrap by character count — the fichas' own currency («24 px si pasa de 24
 * caracteres», «máximo dos renglones») — with an ellipsis on the last line
 * when the text does not fit.
 */
export function envolver(crudo: string, charsPorLinea: number, maxLineas: number): string[] {
  const palabras = crudo
    .trim()
    .split(/\s+/)
    .filter((p) => p !== '');
  const lineas = repartir(palabras, charsPorLinea, maxLineas);
  sellar(lineas, palabras, charsPorLinea);
  return lineas;
}

/** Word-by-word fill; a word longer than the line is sliced, not split. */
function repartir(palabras: readonly string[], charsPorLinea: number, maxLineas: number): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of palabras) {
    if (actual === '') {
      actual = palabra.slice(0, charsPorLinea);
    } else if (`${actual} ${palabra}`.length <= charsPorLinea) {
      actual = `${actual} ${palabra}`;
    } else {
      lineas.push(actual);
      actual = palabra.slice(0, charsPorLinea);
    }
    if (lineas.length === maxLineas) break;
  }
  if (lineas.length < maxLineas && actual !== '') lineas.push(actual);
  return lineas;
}

/**
 * Truncation is decided by content actually lost (a broken loop or a sliced
 * word), never by the line count happening to hit the maximum.
 */
function sellar(lineas: string[], palabras: readonly string[], charsPorLinea: number): void {
  const plano = (t: string): string => t.replace(/…/g, '').replace(/\s+/g, '');
  const ultima = lineas[lineas.length - 1];
  if (ultima === undefined || plano(lineas.join(' ')) === plano(palabras.join(' '))) return;
  const base = ultima.length >= charsPorLinea ? ultima.slice(0, charsPorLinea - 1) : ultima;
  lineas[lineas.length - 1] = `${base}…`;
}

export function pesos(m: Money): string {
  return formatMoney(m);
}

const TZ = 'America/Mexico_City';

/** «14 sep 2026» — the long form Clásico/Moderno/Minimal print. */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(iso));
}

/** «14:32» in Mexico City, whatever host the render runs on. */
export function hora(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

/** «14/09/2026 14:32» — Ticket's numeric stamp. */
export function fechaNumerica(iso: string): string {
  const d = new Date(iso);
  const partes = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).formatToParts(d);
  const valor = (t: string): string => partes.find((p) => p.type === t)?.value ?? '';
  return `${valor('day')}/${valor('month')}/${valor('year')} ${valor('hour')}:${valor('minute')}`;
}

/** Canvas + background; WhatsApp floats the card on the off-white, print fills flat. */
export function lienzo(ancho: number, alto: number, contenido: string, fondo: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" ` +
    `viewBox="0 0 ${ancho} ${alto}">` +
    `<rect width="${ancho}" height="${alto}" fill="${fondo}"/>${contenido}</svg>`
  );
}

/**
 * The card behind every template: white face, hard black shadow (WhatsApp
 * only — a printed comprobante has nothing to cast one onto).
 */
export function tarjeta(
  x: number,
  y: number,
  ancho: number,
  alto: number,
  borde: number,
  conSombra: boolean,
  sombraPx: number = SOMBRA,
): string {
  const sombra = conSombra
    ? `<rect x="${x + sombraPx}" y="${y + sombraPx}" width="${ancho}" height="${alto}" fill="${NEGRO}"/>`
    : '';
  return (
    sombra +
    `<rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="${BLANCO}" ` +
    `stroke="${NEGRO}" stroke-width="${borde}"/>`
  );
}

/** Legal line every salida carries; the only fiscal mention allowed. */
export const LINEA_LEGAL = 'Este documento no es un comprobante fiscal (CFDI).';
