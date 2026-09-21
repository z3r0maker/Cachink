/**
 * The logo anchor box shared by the templates (N-20): the image when the
 * business has one, clipped to the rounded box; the accent monogram in its
 * place when it does not. Monogram ink follows the ficha's contrast rule.
 */

import type { Comprobante } from '../datos.js';
import { BLANCO, NEGRO, texto } from './comun.js';

/** The logo image or the accent monogram box, per each template's anchor. */
export function cajaLogo(
  x: number,
  y: number,
  lado: number,
  radio: number,
  c: Comprobante,
  monogramaFill: string,
): string {
  const borde =
    `<rect x="${x}" y="${y}" width="${lado}" height="${lado}" rx="${radio}" ` +
    `fill="${c.negocio.logoDataUrl === undefined ? c.negocio.acento : BLANCO}" stroke="${NEGRO}" stroke-width="2"/>`;
  if (c.negocio.logoDataUrl === undefined) {
    const centro = y + lado / 2;
    const inicial = c.negocio.monograma ?? '';
    const tamano = lado >= 68 ? 34 : lado >= 58 ? 24 : 15;
    const letra = texto(x + lado / 2, centro + tamano * 0.36, inicial, {
      tamano,
      peso: 800,
      ancla: 'middle',
      fill: monogramaFill,
    });
    return borde + letra;
  }
  const interior = lado - 4;
  return (
    borde +
    `<clipPath id="logo-${x}-${y}"><rect x="${x + 2}" y="${y + 2}" width="${interior}" height="${interior}" rx="${Math.max(radio - 2, 0)}"/></clipPath>` +
    `<image x="${x + 2}" y="${y + 2}" width="${interior}" height="${interior}" ` +
    `preserveAspectRatio="xMidYMid slice" clip-path="url(#logo-${x}-${y})" href="${c.negocio.logoDataUrl}"/>`
  );
}
