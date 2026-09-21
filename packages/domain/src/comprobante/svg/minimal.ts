/**
 * Minimal (N-20) — A6, almost all air: hairline rules, small type, one
 * strong piece (the total). The accent never sits behind text, so the
 * total is always ink; a dark accent also tints the name. The card keeps
 * its fixed A6 height whatever the content (handoff acceptance #4).
 * Transcribed from «Comprobante Minimal.dc.html» A/B/C + spec sheet.
 */

import { luminanciaRelativa } from '../contraste.js';
import type { Comprobante, OpcionesRender } from '../datos.js';
import {
  BLANCO,
  GRAY200,
  GRAY400,
  GRAY600,
  INK,
  LINEA_LEGAL,
  MARGEN_WHATSAPP,
  NEGRO,
  cajaLogo,
  envolver,
  fechaLarga,
  hora,
  lienzo,
  pesos,
  tarjeta,
  texto,
} from './comun.js';

const W = 420;
const H = 592;
const LAT = 38;
const SUP = 40;

interface Trozo {
  readonly svg: string;
  readonly y: number;
}

export function comprobanteMinimalSvg(c: Comprobante, o: OpcionesRender = {}): string {
  const whatsapp = (o.destino ?? 'whatsapp') === 'whatsapp';
  const oscuro = luminanciaRelativa(c.negocio.acento) < 0.45;
  const trozos: string[] = [];
  trozos.push(encabezado(c, SUP, oscuro).svg);
  const meta = filaMeta(c, SUP + 34 + 14);
  trozos.push(meta.svg);
  const cuerpo = conceptos(c, meta.y + 20);
  trozos.push(cuerpo.svg);
  trozos.push(total(c, cuerpo.y + 24));
  trozos.push(filaPago(c, cuerpo.y + 24 + 100 + 20));
  trozos.push(pie(c));
  const m = whatsapp ? MARGEN_WHATSAPP : 0;
  const marco = tarjeta(m, m, W, H, 2, whatsapp);
  return lienzo(
    W + 2 * m,
    H + 2 * m,
    marco + `<g transform="translate(${m},${m})">${trozos.join('')}</g>`,
    BLANCO,
  );
}

function encabezado(c: Comprobante, y: number, oscuro: boolean): Trozo {
  const svg: string[] = [];
  const lineas = envolver(c.negocio.nombre, 30, 2);
  const conLogo = c.negocio.logoDataUrl !== undefined;
  const largo = c.negocio.nombre.length > 24;
  if (conLogo || (largo && c.negocio.monograma !== undefined)) {
    svg.push(cajaLogo(LAT, y, 40, 10, c, oscuro ? BLANCO : NEGRO));
    lineas.forEach((linea, i) => {
      svg.push(texto(LAT + 54, y + 15 + i * 20, linea, { tamano: 16, peso: 700 }));
    });
  } else if (oscuro) {
    svg.push(`<rect x="${LAT}" y="${y}" width="10" height="10" fill="${c.negocio.acento}"/>`);
    lineas.forEach((linea, i) => {
      svg.push(
        texto(LAT + 22, y + 13 + i * 20, linea, { tamano: 16, peso: 700, fill: c.negocio.acento }),
      );
    });
  } else {
    lineas.forEach((linea, i) => {
      svg.push(texto(LAT, y + 13 + i * 20, linea, { tamano: 16, peso: 700 }));
    });
  }
  return { svg: svg.join(''), y: y + Math.max(lineas.length * 20, 40) };
}

function filaMeta(c: Comprobante, y: number): Trozo {
  const svg =
    texto(LAT, y + 11, `COMPROBANTE ${c.folio}`, {
      tamano: 11,
      peso: 600,
      fill: GRAY400,
      espaciado: 0.06,
    }) +
    texto(W - LAT, y + 11, `${fechaLarga(c.fechaHora)} · ${hora(c.fechaHora)}`, {
      tamano: 11,
      peso: 600,
      fill: GRAY400,
      espaciado: 0.06,
      ancla: 'end',
    }) +
    `<rect x="${LAT}" y="${y + 14}" width="${W - 2 * LAT}" height="1" fill="${GRAY200}"/>`;
  return { svg, y: y + 14 };
}

function conceptos(c: Comprobante, y: number): Trozo {
  const svg: string[] = [];
  let py = y + 18;
  c.conceptos.forEach((k) => {
    const lineas = envolver(k.concepto, 28, 2);
    lineas.forEach((linea, i) => {
      const cantidad = i === lineas.length - 1 ? `  × ${k.cantidad}` : '';
      svg.push(texto(LAT, py + i * 17, linea + cantidad, { tamano: 13, fill: INK }));
    });
    svg.push(texto(W - LAT, py, pesos(k.importe), { tamano: 13, ancla: 'end', mono: true }));
    py += Math.max(lineas.length * 17, 17) + 12;
  });
  return { svg: svg.join(''), y: py - 12 };
}

function total(c: Comprobante, y: number): string {
  const cifras = pesos(c.total);
  const tamano = cifras.length > 9 ? 44 : 52;
  return (
    texto(LAT, y + 11, 'TOTAL MXN', { tamano: 11, peso: 600, fill: GRAY400, espaciado: 0.06 }) +
    texto(LAT, y + 11 + 8 + tamano, cifras, { tamano, peso: 800 }) +
    `<rect x="${LAT}" y="${y + 19 + tamano + 4}" width="96" height="4" fill="${c.negocio.acento}"/>`
  );
}

/** Minimal speaks the method: «Pagado en efectivo», «Pagado por transferencia». */
function frasePago(metodo: string): string {
  if (metodo === 'Efectivo') return 'Pagado en efectivo';
  if (metodo === 'Transferencia') return 'Pagado por transferencia';
  if (metodo === 'Crédito') return 'Pagado a crédito';
  if (metodo === 'Tarjeta') return 'Pagado con tarjeta';
  return 'Pagado con QR · CoDi';
}

function filaPago(c: Comprobante, y: number): string {
  return texto(LAT, y + 12, frasePago(c.metodoPago), { tamano: 12, peso: 600, fill: GRAY600 });
}

function contacto(c: Comprobante): string | null {
  const partes: string[] = [];
  if (c.negocio.direccion !== undefined) partes.push(c.negocio.direccion);
  if (c.negocio.whatsapp !== undefined) partes.push(`WhatsApp ${c.negocio.whatsapp}`);
  if (c.negocio.redes !== undefined) partes.push(c.negocio.redes);
  return partes.length > 0 ? partes.join(' · ') : null;
}

/** Pinned to the A6 bottom: hairline, leyenda, contacto, legal. */
function pie(c: Comprobante): string {
  const svg: string[] = [
    `<rect x="${LAT}" y="${H - 30 - pieAltura(c)}" width="${W - 2 * LAT}" height="1" fill="${GRAY200}"/>`,
  ];
  let py = H - 30 - pieAltura(c) + 25;
  if (c.negocio.leyenda !== undefined) {
    svg.push(texto(LAT, py, c.negocio.leyenda, { tamano: 13, peso: 700 }));
    py += 19;
  }
  const lineas = contacto(c);
  if (lineas !== null) {
    svg.push(texto(LAT, py, lineas, { tamano: 11, fill: GRAY600 }));
    py += 17;
  }
  const legal = c.mostrarMarcaXangarro ? `${LINEA_LEGAL} · Hecho con Xangarro` : LINEA_LEGAL;
  svg.push(texto(LAT, py, legal, { tamano: 9, fill: GRAY400 }));
  return svg.join('');
}

function pieAltura(c: Comprobante): number {
  let alto = 13 + 12;
  if (c.negocio.leyenda !== undefined) alto += 19;
  if (contacto(c) !== null) alto += 17;
  return alto + 4;
}
