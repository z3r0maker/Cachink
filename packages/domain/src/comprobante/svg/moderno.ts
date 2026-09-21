/**
 * Moderno (N-20) — colour band on top, everything left-aligned, the total
 * in its own full-width band so it survives tiny WhatsApp previews.
 * Transcribed from «Comprobante Moderno.dc.html» A/B/C + spec sheet.
 */

import { tintaSobre } from '../contraste.js';
import type { Comprobante, OpcionesRender } from '../datos.js';
import { filaPago, pie, pieAltura } from './moderno-pie.js';
import { LAT, W } from './moderno-metricas.js';
import {
  BLANCO,
  GRAY600,
  INK,
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

/** WhatsApp floats the card with its shadow; print fills the media-carta page. */
function altoDeTarjeta(whatsapp: boolean, altoTarjeta: number, m: number): number {
  if (whatsapp) return altoTarjeta + 2 * m;
  return Math.max(altoTarjeta, Math.round((W * 216) / 140));
}

interface Trozo {
  readonly svg: string;
  readonly y: number;
}

export function comprobanteModernoSvg(c: Comprobante, o: OpcionesRender = {}): string {
  const whatsapp = (o.destino ?? 'whatsapp') === 'whatsapp';
  const tinta = tintaSobre(c.negocio.acento);
  const trozos: string[] = [];
  const banda = bandaSup(c, tinta);
  trozos.push(banda.svg);
  const cuerpo = cuerpoTarjeta(c, banda.y + 28, tinta);
  trozos.push(cuerpo.svg);
  return envolverTarjeta(whatsapp, trozos.join(''), cuerpo.y + 32);
}

/** Everything under the band, in the artboards' 26 px rhythm. */
function cuerpoTarjeta(c: Comprobante, y: number, tinta: string): Trozo {
  const svg: string[] = [];
  svg.push(folioYFecha(c, y).svg);
  svg.push(conceptos(c, y + 52).svg);
  const trasConceptos = y + 52 + conceptosAltura(c) + 26;
  svg.push(bloqueTotal(c, trasConceptos, tinta).svg);
  const trasTotal = trasConceptos + 85 + 26;
  svg.push(filaPago(c, trasTotal));
  svg.push(pie(c, trasTotal + 52));
  return { svg: svg.join(''), y: trasTotal + 52 + pieAltura(c) };
}

function envolverTarjeta(whatsapp: boolean, contenido: string, altoTarjeta: number): string {
  const m = whatsapp ? MARGEN_WHATSAPP : 0;
  const alto = altoDeTarjeta(whatsapp, altoTarjeta, m);
  const marco = tarjeta(m, m, W, alto - 2 * m, 2.5, whatsapp);
  return lienzo(
    W + 2 * m,
    alto,
    marco + `<g transform="translate(${m},${m})">${contenido}</g>`,
    BLANCO,
  );
}

/** The band's shape per the artboards: logo at the left, or the name alone
 * (30 px) when short, or the monogram box keeping the form for long names. */
interface FormaBanda {
  readonly conCaja: boolean;
  readonly xNombre: number;
  readonly tamano: number;
  readonly charsLinea: number;
}

function formaBanda(c: Comprobante): FormaBanda {
  const largo = c.negocio.nombre.length > 24;
  const conLogo = c.negocio.logoDataUrl !== undefined;
  const conCaja = conLogo || largo;
  return {
    conCaja,
    xNombre: conCaja ? LAT + 68 + 18 : LAT,
    tamano: conLogo ? 28 : largo ? 24 : 30,
    charsLinea: largo ? 28 : 24,
  };
}

function bandaSup(c: Comprobante, tinta: string): Trozo {
  const forma = formaBanda(c);
  const svg: string[] = [];
  if (forma.conCaja) {
    svg.push(cajaLogo(LAT, 28, 68, 14, c, tinta));
  }
  const lineas = envolver(c.negocio.nombre, forma.charsLinea, 2);
  lineas.forEach((linea, i) => {
    svg.push(
      texto(
        forma.xNombre,
        28 + Math.round(forma.tamano * 0.95) + i * Math.round(forma.tamano * 1.15),
        linea,
        {
          tamano: forma.tamano,
          peso: 800,
          fill: tinta,
        },
      ),
    );
  });
  const altoNombre = lineas.length * Math.round(forma.tamano * 1.15);
  const extraDireccion = c.negocio.direccion === undefined ? 0 : 23;
  svg.push(...lineaDireccion(c, forma, tinta));
  const altoContenido = Math.max(forma.conCaja ? 68 : 0, altoNombre + extraDireccion);
  const altoBanda = 28 + altoContenido + 28;
  const fondo =
    `<rect x="0" y="0" width="${W}" height="${altoBanda}" fill="${c.negocio.acento}"/>` +
    `<rect x="0" y="${altoBanda - 1.25}" width="${W}" height="2.5" fill="${NEGRO}"/>`;
  return { svg: fondo + svg.join(''), y: altoBanda + 1 };
}

/**
 * The address inside the band: as-is beside the logo box; alone and in
 * CAPITALS under a short name (the artboards' «oficio» line).
 */
function lineaDireccion(c: Comprobante, forma: FormaBanda, tinta: string): string[] {
  if (c.negocio.direccion === undefined) return [];
  const enBanda = forma.conCaja;
  const contenido = enBanda ? c.negocio.direccion : c.negocio.direccion.toLocaleUpperCase('es-MX');
  const linea = envolver(contenido, enBanda ? 40 : 36, 1)[0] ?? '';
  const y =
    28 + Math.round(forma.tamano * 0.95) + Math.round(forma.tamano * 1.15) + (enBanda ? 5 : 0);
  return [
    texto(forma.xNombre, y, linea, {
      tamano: 13,
      peso: 600,
      fill: tinta,
      espaciado: enBanda ? 0 : 0.08,
    }),
  ];
}

function folioYFecha(c: Comprobante, y: number): Trozo {
  const svg =
    texto(LAT, y + 21, 'COMPROBANTE', { tamano: 11, peso: 700, fill: GRAY600, espaciado: 0.08 }) +
    texto(LAT, y + 24 + 18, c.folio, { tamano: 18, peso: 700, mono: true }) +
    texto(LAT + 140, y + 21, 'FECHA', { tamano: 11, peso: 700, fill: GRAY600, espaciado: 0.08 }) +
    texto(LAT + 140, y + 24 + 18, `${fechaLarga(c.fechaHora)} · ${hora(c.fechaHora)} h`, {
      tamano: 15,
      peso: 600,
      fill: INK,
    });
  return { svg, y: y + 24 + 18 };
}

function conceptos(c: Comprobante, y: number): Trozo {
  const svg: string[] = [];
  let py = y;
  for (const k of c.conceptos) {
    const lineas = envolver(k.concepto, 26, 2);
    lineas.forEach((linea, i) => {
      svg.push(texto(LAT, py + 16 + i * 20, linea, { tamano: 16, peso: 700 }));
    });
    svg.push(
      texto(LAT, py + 16 + lineas.length * 20, subtextoCantidad(k), {
        tamano: 13,
        peso: 500,
        fill: GRAY600,
      }),
      texto(W - LAT, py + 17, pesos(k.importe), {
        tamano: 17,
        peso: 500,
        ancla: 'end',
        mono: true,
      }),
    );
    py += alturaFila(k);
  }
  return { svg: svg.join(''), y: py };
}

/** «3 × $60.00»; amounts that do not divide evenly say «3 unidades» instead. */
function subtextoCantidad(k: { cantidad: number; importe: bigint }): string {
  if (k.importe % BigInt(k.cantidad) === 0n) {
    return `${k.cantidad} × ${pesos(k.importe / BigInt(k.cantidad))}`;
  }
  return `${k.cantidad} ${k.cantidad === 1 ? 'unidad' : 'unidades'}`;
}

function alturaFila(k: { concepto: string }): number {
  const lineas = envolver(k.concepto, 26, 2);
  return Math.max(lineas.length * 20 + 34, 46) + 16;
}

function conceptosAltura(c: Comprobante): number {
  return c.conceptos.reduce((alto, k) => alto + alturaFila(k), 0);
}

function bloqueTotal(c: Comprobante, y: number, tinta: string): Trozo {
  const svg =
    `<rect x="${LAT}" y="${y}" width="${W - 2 * LAT}" height="85" rx="14" fill="${c.negocio.acento}" stroke="${NEGRO}" stroke-width="2.5"/>` +
    texto(LAT + 22, y + 36, 'TOTAL MXN', { tamano: 12, peso: 700, fill: tinta, espaciado: 0.08 }) +
    texto(LAT + 22, y + 74, pesos(c.total), { tamano: 44, peso: 800, fill: tinta });
  return { svg, y: y + 85 };
}
