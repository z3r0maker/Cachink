/**
 * Ticket's footer (N-20): the uppercase payment row and the centered
 * closing block, split from the roll file for the size ceiling.
 */

import type { Comprobante } from '../datos.js';
import { GRAY400, INK, LINEA_LEGAL, texto } from './comun.js';
import { LAT, W } from './ticket-metricas.js';
import { separador } from './ticket.js';

export function filaPago(c: Comprobante, y: number): string {
  return (
    texto(LAT, y + 12, 'PAGO', { tamano: 12, fill: INK, mono: true }) +
    texto(W - LAT, y + 12, c.metodoPago.toLocaleUpperCase('es-MX'), {
      tamano: 12,
      peso: 700,
      ancla: 'end',
      mono: true,
    })
  );
}

export function contacto(c: Comprobante): string[] {
  const lineas: string[] = [];
  if (c.negocio.whatsapp !== undefined) lineas.push(`WHATSAPP ${c.negocio.whatsapp}`);
  if (c.negocio.redes !== undefined) lineas.push(c.negocio.redes.toLocaleUpperCase('es-MX'));
  return lineas;
}

export function pieAltura(c: Comprobante): number {
  let alto = 16 + 2;
  if (c.negocio.leyenda !== undefined) alto += 23;
  alto += contacto(c).length * 18;
  alto += 8 + (c.mostrarMarcaXangarro ? 2 : 1) * 15;
  return alto;
}

export function pie(c: Comprobante, y: number): string {
  const svg: string[] = [separador(y)];
  let py = y + 26;
  if (c.negocio.leyenda !== undefined) {
    svg.push(texto(W / 2, py, c.negocio.leyenda, { tamano: 15, peso: 800, ancla: 'middle' }));
    py += 23;
  }
  contacto(c).forEach((linea) => {
    svg.push(texto(W / 2, py, linea, { tamano: 11, fill: INK, ancla: 'middle', mono: true }));
    py += 18;
  });
  const legales = c.mostrarMarcaXangarro ? [LINEA_LEGAL, 'Hecho con Xangarro'] : [LINEA_LEGAL];
  legales.forEach((linea, i) => {
    svg.push(
      texto(W / 2, py + 4 + i * 15, linea, {
        tamano: 10,
        fill: GRAY400,
        ancla: 'middle',
        mono: true,
      }),
    );
  });
  return svg.join('');
}
