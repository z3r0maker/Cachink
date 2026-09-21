/**
 * Clásico's footer (N-20): the payment pill row and the centered closing
 * block, split from the card file for the size ceiling.
 */

import type { Comprobante } from '../datos.js';
import { GRAY400, GRAY600, INK, LINEA_LEGAL, NEGRO, PASTEL_METODO, texto } from './comun.js';
import { PAD, W, X_DER } from './clasico-metricas.js';

export function filaPago(c: Comprobante, y: number): string {
  const anchoTexto = Math.round(c.metodoPago.length * 7.6) + 28;
  const x = X_DER - anchoTexto;
  return (
    texto(PAD.lat, y + 17, 'FORMA DE PAGO', {
      tamano: 11,
      peso: 700,
      fill: GRAY600,
      espaciado: 0.08,
    }) +
    `<rect x="${x}" y="${y}" width="${anchoTexto}" height="26" rx="13" fill="${PASTEL_METODO[c.metodoPago]}" stroke="${NEGRO}" stroke-width="2"/>` +
    texto(x + anchoTexto / 2, y + 17.5, c.metodoPago, { tamano: 13, peso: 700, ancla: 'middle' })
  );
}

export function pieAltura(c: Comprobante): number {
  const contacto = contactoVisibile(c);
  let alto = 20; // border + padding-top
  if (c.negocio.leyenda !== undefined) alto += 30;
  if (contacto !== null) alto += 26;
  alto += 4 + (c.mostrarMarcaXangarro ? 2 : 1) * 16;
  return alto;
}

export function contactoVisibile(c: Comprobante): string | null {
  const partes: string[] = [];
  if (c.negocio.whatsapp !== undefined) partes.push(`WhatsApp ${c.negocio.whatsapp}`);
  if (c.negocio.redes !== undefined) partes.push(c.negocio.redes);
  return partes.length > 0 ? partes.join(' · ') : null;
}

export function pie(c: Comprobante, y: number): string {
  const svg: string[] = [
    `<rect x="${PAD.lat}" y="${y}" width="${W - 2 * PAD.lat}" height="2" fill="${NEGRO}"/>`,
  ];
  let py = y + 33;
  if (c.negocio.leyenda !== undefined) {
    svg.push(texto(W / 2, py, c.negocio.leyenda, { tamano: 17, peso: 800, ancla: 'middle' }));
    py += 30;
  }
  const contacto = contactoVisibile(c);
  if (contacto !== null) {
    svg.push(texto(W / 2, py, contacto, { tamano: 13, peso: 600, fill: INK, ancla: 'middle' }));
    py += 26;
  }
  const lineas = c.mostrarMarcaXangarro ? [LINEA_LEGAL, 'Hecho con Xangarro'] : [LINEA_LEGAL];
  lineas.forEach((linea, i) => {
    svg.push(
      texto(W / 2, py + 4 + i * 16, linea, {
        tamano: 11,
        peso: 500,
        fill: GRAY400,
        ancla: 'middle',
      }),
    );
  });
  return svg.join('');
}
