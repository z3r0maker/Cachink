/**
 * Ticket (N-20) — the 58 mm thermal roll: narrow, mono, centred, dashed
 * rules and torn paper edges. Works the same shared in chat or printed on
 * a Bluetooth thermal (accent ignored in thermal print; the PDF carries it).
 * Transcribed from «Comprobante Ticket.dc.html» A/B/C + spec sheet.
 */

import { tintaSobre } from '../contraste.js';
import { filaPago, pie, pieAltura } from './ticket-pie.js';
import { DIENTE, LAT, W } from './ticket-metricas.js';
import type { Comprobante, OpcionesRender } from '../datos.js';
import {
  BLANCO,
  FONDO_APP,
  GRAY400,
  GRAY600,
  INK,
  MARGEN_WHATSAPP,
  NEGRO,
  cajaLogo,
  envolver,
  fechaNumerica,
  lienzo,
  pesos,
  texto,
} from './comun.js';

interface Trozo {
  readonly svg: string;
  readonly y: number;
}

export function comprobanteTicketSvg(c: Comprobante, o: OpcionesRender = {}): string {
  const whatsapp = (o.destino ?? 'whatsapp') === 'whatsapp';
  const tinta = tintaSobre(c.negocio.acento);
  const trozos: string[] = [];
  const cabeza = encabezado(c, 20 + DIENTE, tinta);
  trozos.push(cabeza.svg);
  const meta = filaMeta(c, cabeza.y + 16);
  trozos.push(meta.svg);
  const conceptosY = meta.y + 16;
  const cuerpo = conceptos(c, conceptosY);
  trozos.push(cuerpo.svg);
  const total = bloqueTotal(c, cuerpo.y + 16, tinta);
  trozos.push(total.svg);
  trozos.push(filaPago(c, total.y + 16));
  const pieY = total.y + 16 + 18 + 16;
  trozos.push(pie(c, pieY));
  const altoTarjeta = pieY + pieAltura(c) + 26 + DIENTE;
  return envolverRol(whatsapp, trozos.join(''), altoTarjeta);
}

function envolverRol(whatsapp: boolean, contenido: string, altoTarjeta: number): string {
  const m = whatsapp ? MARGEN_WHATSAPP : 0;
  const alto = altoTarjeta + 2 * m;
  const marco =
    `<rect x="${m}" y="${m}" width="${W}" height="${altoTarjeta}" fill="${BLANCO}"/>` +
    `<rect x="${m}" y="${m}" width="2" height="${altoTarjeta}" fill="${NEGRO}"/>` +
    `<rect x="${m + W - 2}" y="${m}" width="2" height="${altoTarjeta}" fill="${NEGRO}"/>` +
    dientes(m, m, true) +
    dientes(m, m + altoTarjeta - DIENTE, false);
  return lienzo(
    W + 2 * m,
    alto,
    marco + `<g transform="translate(${m},${m})">${contenido}</g>`,
    FONDO_APP,
  );
}

/**
 * The saw-tooth torn edge: 12 px teeth at a 24 px pitch, black. Top teeth
 * hang down from the card's top edge; bottom teeth rise from the bottom.
 */
function dientes(x: number, y: number, haciaAbajo: boolean): string {
  const paso = haciaAbajo ? [DIENTE, DIENTE, DIENTE, -DIENTE] : [DIENTE, -DIENTE, DIENTE, DIENTE];
  const trazo: string[] = [`M ${x} ${y}`];
  for (let dx = 0; dx < W; dx += 2 * DIENTE) {
    trazo.push(`l ${paso[0]} ${paso[1]} l ${paso[2]} ${paso[3]}`);
  }
  trazo.push('Z');
  return `<path d="${trazo.join(' ')}" fill="${NEGRO}"/>`;
}

export function separador(y: number): string {
  return `<line x1="${LAT}" y1="${y}" x2="${W - LAT}" y2="${y}" stroke="${NEGRO}" stroke-width="2" stroke-dasharray="6 5"/>`;
}

function encabezado(c: Comprobante, y: number, tinta: string): Trozo {
  const svg: string[] = [];
  const conLogo = c.negocio.logoDataUrl !== undefined;
  const largo = c.negocio.nombre.length > 28;
  const tamano = largo ? 16 : 20;
  const lineas = envolver(c.negocio.nombre.toLocaleUpperCase('es-MX'), largo ? 30 : 24, 3);
  let py = y;
  if (conLogo) {
    svg.push(cajaLogo((W - 58) / 2, py, 58, 12, c, tinta));
    py += 58 + 10;
  }
  lineas.forEach((linea, i) => {
    svg.push(
      texto(W / 2, py + Math.round(tamano * 0.95) + i * Math.round(tamano * 1.2), linea, {
        tamano,
        peso: 800,
        ancla: 'middle',
      }),
    );
  });
  py += lineas.length * Math.round(tamano * 1.2) + 2;
  if (c.negocio.direccion !== undefined) {
    envolver(c.negocio.direccion, 32, 2).forEach((linea, i) => {
      svg.push(
        texto(W / 2, py + 11 + i * 17, linea, {
          tamano: 11,
          fill: GRAY600,
          ancla: 'middle',
          mono: true,
        }),
      );
    });
    py += 36;
  }
  py += 6;
  svg.push(separador(py));
  return { svg: svg.join(''), y: py + 4 };
}

function filaMeta(c: Comprobante, y: number): Trozo {
  const svg =
    texto(LAT, y + 12, 'COMPROBANTE', { tamano: 12, fill: INK, mono: true }) +
    texto(W - LAT, y + 12, c.folio, { tamano: 12, peso: 700, ancla: 'end', mono: true }) +
    texto(LAT, y + 29, 'FECHA', { tamano: 12, fill: INK, mono: true }) +
    texto(W - LAT, y + 29, fechaNumerica(c.fechaHora), { tamano: 12, ancla: 'end', mono: true }) +
    separador(y + 40);
  return { svg, y: y + 40 };
}

function conceptos(c: Comprobante, y: number): Trozo {
  const svg: string[] = [];
  let py = y + 12;
  c.conceptos.forEach((k, idx) => {
    const lineas = envolver(k.concepto.toLocaleUpperCase('es-MX'), 26, 2);
    lineas.forEach((linea, i) => {
      svg.push(texto(LAT, py + 12 + i * 16, linea, { tamano: 12, peso: 700, mono: true }));
    });
    const sub = py + 12 + lineas.length * 16;
    svg.push(
      texto(LAT, sub, subtextoCantidad(k), {
        tamano: 12,
        fill: GRAY600,
        mono: true,
      }),
      `<line x1="${LAT + 90}" y1="${sub - 3}" x2="${W - LAT - 78}" y2="${sub - 3}" stroke="${GRAY400}" stroke-width="1" stroke-dasharray="1 3"/>`,
      texto(W - LAT, sub, pesos(k.importe), { tamano: 12, peso: 500, ancla: 'end', mono: true }),
    );
    py = sub + 10 + (idx < c.conceptos.length - 1 ? 10 : 0);
  });
  svg.push(separador(py + 8));
  return { svg: svg.join(''), y: py + 8 };
}

/** «3 x 60.00» (sin $, como el rollo); indivisibles dicen «3 unid». */
function subtextoCantidad(k: { cantidad: number; importe: bigint }): string {
  if (k.importe % BigInt(k.cantidad) === 0n) {
    return `${k.cantidad} x ${pesos(k.importe / BigInt(k.cantidad)).replace('$', '')}`;
  }
  return `${k.cantidad} ${k.cantidad === 1 ? 'servicio' : 'unid'}`;
}

function bloqueTotal(c: Comprobante, y: number, tinta: string): Trozo {
  const cifras = pesos(c.total);
  const tamano = cifras.length > 8 ? 24 : 26;
  const svg =
    `<rect x="${LAT}" y="${y}" width="${W - 2 * LAT}" height="50" fill="${c.negocio.acento}" stroke="${NEGRO}" stroke-width="2"/>` +
    texto(LAT + 14, y + 30, 'TOTAL MXN', { tamano: 12, peso: 700, fill: tinta, espaciado: 0.08 }) +
    texto(W - LAT - 14, y + 33, cifras, {
      tamano,
      peso: 700,
      fill: tinta,
      ancla: 'end',
      mono: true,
    });
  return { svg, y: y + 50 };
}
