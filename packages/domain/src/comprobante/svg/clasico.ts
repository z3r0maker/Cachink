/**
 * Clásico (N-20) — the traditional nota de venta: centered header, ruled
 * rows, framed total. Transcribed 1:1 from «Comprobante Clasico.dc.html»
 * artboards A/B/C; the spec sheet there governs the dynamic rules.
 */

import { tintaSobre } from '../contraste.js';
import type { Comprobante, OpcionesRender } from '../datos.js';
import {
  BLANCO,
  GRAY200,
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
import { filaPago, pie, pieAltura } from './clasico-pie.js';
import { PAD, W, X_CANT, X_DER } from './clasico-metricas.js';

interface Trozo {
  readonly svg: string;
  readonly y: number;
}

export function comprobanteClasicoSvg(c: Comprobante, o: OpcionesRender = {}): string {
  const whatsapp = (o.destino ?? 'whatsapp') === 'whatsapp';
  const tinta = tintaSobre(c.negocio.acento);
  const trozos: string[] = [];
  const cabeza = encabezado(c, PAD.sup, tinta);
  trozos.push(cabeza.svg);
  const folia = filaFolio(c, cabeza.y + 50);
  trozos.push(folia.svg);
  const tabla = tablaYFilas(c, folia.y + 22);
  trozos.push(tabla.svg);
  const total = bloqueTotal(c, tabla.y + 20, tinta);
  trozos.push(total.svg);
  trozos.push(filaPago(c, total.y + 14));
  const pieY = total.y + 14 + 26 + 24;
  trozos.push(pie(c, pieY));
  const altoTarjeta = pieY + pieAltura(c) + PAD.inf;

  const m = whatsapp ? MARGEN_WHATSAPP : 0;
  const alto = whatsapp ? altoTarjeta + 2 * m : Math.max(altoTarjeta, Math.round((W * 216) / 140));
  const marco = tarjeta(m, m, W, alto - 2 * m, 2.5, whatsapp);
  return lienzo(
    W + 2 * m,
    alto,
    marco + `<g transform="translate(${m},${m})">${trozos.join('')}</g>`,
    BLANCO,
  );
}

function encabezado(c: Comprobante, y: number, tinta: string): Trozo {
  const svg: string[] = [cajaLogo((W - 84) / 2, y, 84, 14, c, tinta)];
  let py = y + 84 + 14;
  const largo = c.negocio.nombre.length > 24;
  const tamano = largo ? 24 : 30;
  const lineas = envolver(c.negocio.nombre, largo ? 34 : 26, 2);
  lineas.forEach((linea, i) => {
    svg.push(
      texto(W / 2, py + Math.round(tamano * 0.95) + i * Math.round(tamano * 1.12), linea, {
        tamano,
        peso: 800,
        ancla: 'middle',
      }),
    );
  });
  py += lineas.length * Math.round(tamano * 1.12);
  if (c.negocio.direccion !== undefined) {
    envolver(c.negocio.direccion, 42, 2).forEach((linea, i) => {
      svg.push(
        texto(W / 2, py + 13 + i * 20, linea, {
          tamano: 13,
          peso: 500,
          fill: GRAY600,
          ancla: 'middle',
        }),
      );
    });
    py += 40;
  }
  return { svg: svg.join(''), y: py + 14 };
}

function filaFolio(c: Comprobante, y: number): Trozo {
  const svg =
    texto(PAD.lat, y + 21, 'COMPROBANTE DE VENTA', {
      tamano: 11,
      peso: 700,
      fill: GRAY600,
      espaciado: 0.08,
    }) +
    texto(PAD.lat, y + 24 + 19, c.folio, { tamano: 19, peso: 700, mono: true }) +
    texto(X_DER, y + 21, `${fechaLarga(c.fechaHora)}  ·  ${hora(c.fechaHora)} h`, {
      tamano: 13,
      peso: 600,
      fill: INK,
      ancla: 'end',
    });
  return { svg, y: y + 24 + 19 };
}

function tablaYFilas(c: Comprobante, y: number): Trozo {
  const svg: string[] = [encabezadoTabla(y)];
  let py = y + 32;
  for (const k of c.conceptos) {
    const { svg: fila, dy } = filaConcepto(k, py);
    svg.push(fila);
    py += dy;
  }
  return { svg: svg.join(''), y: py };
}

function encabezadoTabla(y: number): string {
  const ancho = W - 2 * PAD.lat;
  return (
    `<rect x="${PAD.lat}" y="${y}" width="${ancho}" height="2" fill="${NEGRO}"/>` +
    texto(PAD.lat, y + 21, 'CONCEPTO', { tamano: 11, peso: 700, fill: GRAY600, espaciado: 0.08 }) +
    texto(X_CANT, y + 21, 'CANT', {
      tamano: 11,
      peso: 700,
      fill: GRAY600,
      espaciado: 0.08,
      ancla: 'middle',
    }) +
    texto(X_DER, y + 21, 'IMPORTE', {
      tamano: 11,
      peso: 700,
      fill: GRAY600,
      espaciado: 0.08,
      ancla: 'end',
    }) +
    `<rect x="${PAD.lat}" y="${y + 30}" width="${ancho}" height="2" fill="${NEGRO}"/>`
  );
}

/** One concept row and how much it advances the cursor. */
function filaConcepto(
  k: Comprobante['conceptos'][number],
  y: number,
): { readonly svg: string; readonly dy: number } {
  const lineas = envolver(k.concepto, 30, 2);
  const svg: string[] = [];
  lineas.forEach((linea, i) => {
    svg.push(texto(PAD.lat, y + 17 + i * 18, linea, { tamano: 15, peso: 600, fill: INK }));
  });
  svg.push(
    texto(X_CANT, y + 17, String(k.cantidad), {
      tamano: 14,
      fill: INK,
      ancla: 'middle',
      mono: true,
    }),
    texto(X_DER, y + 18, pesos(k.importe), { tamano: 15, peso: 500, ancla: 'end', mono: true }),
  );
  const dy = 26 + Math.max(lineas.length * 18, 18);
  svg.push(
    `<rect x="${PAD.lat}" y="${y + dy}" width="${W - 2 * PAD.lat}" height="1" fill="${GRAY200}"/>`,
  );
  return { svg: svg.join(''), dy: dy + 1 };
}

function bloqueTotal(c: Comprobante, y: number, tinta: string): Trozo {
  const svg =
    `<rect x="${PAD.lat}" y="${y}" width="${W - 2 * PAD.lat}" height="73" fill="${c.negocio.acento}" stroke="${NEGRO}" stroke-width="2.5"/>` +
    texto(PAD.lat + 18, y + 38, 'TOTAL MXN', {
      tamano: 13,
      peso: 700,
      fill: tinta,
      espaciado: 0.08,
    }) +
    texto(X_DER - 18, y + 58, pesos(c.total), {
      tamano: 34,
      peso: 700,
      fill: tinta,
      ancla: 'end',
      mono: true,
    });
  return { svg, y: y + 73 };
}
