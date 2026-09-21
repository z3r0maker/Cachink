/**
 * The four renderers behind one call (N-20): every template renders the
 * same Comprobante object — no template receives fields the others do not.
 */

import type { Comprobante, OpcionesRender, PlantillaComprobante } from '../datos.js';
import { comprobanteClasicoSvg } from './clasico.js';
import { comprobanteMinimalSvg } from './minimal.js';
import { comprobanteModernoSvg } from './moderno.js';
import { comprobanteTicketSvg } from './ticket.js';

export { comprobanteClasicoSvg } from './clasico.js';
export { comprobanteMinimalSvg } from './minimal.js';
export { comprobanteModernoSvg } from './moderno.js';
export { comprobanteTicketSvg } from './ticket.js';

export function comprobanteSvg(
  plantilla: PlantillaComprobante,
  c: Comprobante,
  o: OpcionesRender = {},
): string {
  switch (plantilla) {
    case 'moderno':
      return comprobanteModernoSvg(c, o);
    case 'ticket':
      return comprobanteTicketSvg(c, o);
    case 'minimal':
      return comprobanteMinimalSvg(c, o);
    default:
      return comprobanteClasicoSvg(c, o);
  }
}
