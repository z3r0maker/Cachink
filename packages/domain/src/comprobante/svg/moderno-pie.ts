/**
 * Moderno's footer (N-20): the payment pill row and the pinned-to-bottom
 * contact block, split from the band/body file for the size ceiling.
 */

import type { Comprobante } from '../datos.js';
import {
  GRAY200,
  GRAY400,
  GRAY600,
  INK,
  LINEA_LEGAL,
  NEGRO,
  PASTEL_METODO,
  texto,
} from './comun.js';
import { LAT, W } from './moderno-metricas.js';

export function filaPago(c: Comprobante, y: number): string {
  const anchoTexto = Math.round(c.metodoPago.length * 7.6) + 28;
  const x = W - LAT - anchoTexto;
  return (
    texto(LAT, y + 17, 'PAGO', { tamano: 11, peso: 700, fill: GRAY600, espaciado: 0.08 }) +
    `<rect x="${x}" y="${y}" width="${anchoTexto}" height="26" rx="13" fill="${PASTEL_METODO[c.metodoPago]}" stroke="${NEGRO}" stroke-width="2"/>` +
    texto(x + anchoTexto / 2, y + 17.5, c.metodoPago, { tamano: 13, peso: 700, ancla: 'middle' })
  );
}

function contactoVisibile(c: Comprobante): string | null {
  const partes: string[] = [];
  if (c.negocio.whatsapp !== undefined) partes.push(`WhatsApp ${c.negocio.whatsapp}`);
  if (c.negocio.redes !== undefined) partes.push(c.negocio.redes);
  return partes.length > 0 ? partes.join(' · ') : null;
}

export function pieAltura(c: Comprobante): number {
  let alto = 20; // border + padding-top
  if (c.negocio.leyenda !== undefined) alto += 30;
  const contacto = contactoVisibile(c);
  if (contacto !== null) alto += 24;
  alto += 24;
  return alto;
}

export function pie(c: Comprobante, y: number): string {
  const svg: string[] = [
    `<rect x="${LAT}" y="${y}" width="${W - 2 * LAT}" height="2" fill="${GRAY200}"/>`,
  ];
  let py = y + 34;
  if (c.negocio.leyenda !== undefined) {
    svg.push(texto(LAT, py, c.negocio.leyenda, { tamano: 18, peso: 800 }));
    py += 30;
  }
  const contacto = contactoVisibile(c);
  if (contacto !== null) {
    svg.push(texto(LAT, py, contacto, { tamano: 14, peso: 600, fill: INK }));
    py += 24;
  }
  const legal = c.mostrarMarcaXangarro ? `${LINEA_LEGAL} · Hecho con Xangarro` : LINEA_LEGAL;
  svg.push(texto(LAT, py, legal, { tamano: 11, peso: 500, fill: GRAY400 }));
  return svg.join('');
}
