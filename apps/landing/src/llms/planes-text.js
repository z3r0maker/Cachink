/**
 * Plan copy for the llms files, derived from landing/planes.js so the text
 * models read is the pricing table visitors see.
 */
import { PLANES, ANUAL_NOTA, PAGO_LINEA, pesos } from '../../landing/planes.js';

const precio = (p) =>
  p.mensual === 0 ? 'Gratis para siempre' : `${pesos(p.mensual)} MXN/mes + IVA`;

/** One bullet per plan: name, price and its feature list on one line. */
export function planesResumen() {
  return PLANES.map((p) => `- **${p.nombre}** — ${precio(p)}: ${p.features.join(', ')}`).join('\n');
}

/** One subsection per plan, features as bullets, for the full spec. */
export function planesDetalle() {
  return PLANES.map((p) => {
    const anual = p.anual > 0 ? ` (${pesos(p.anual)} MXN al año + IVA, 2 meses gratis)` : '';
    const incluye = p.incluye ? `Todo lo de ${p.incluye}, más:\n` : '';
    const features = p.features.map((f) => `- ${f}`).join('\n');
    const don = p.donCuentas ? `\n- ${p.donCuentas.title}: ${p.donCuentas.sub}` : '';
    return `### ${p.nombre} — ${precio(p)}${anual}\n${p.tagline}\n${incluye}${features}${don}`;
  }).join('\n\n');
}

/** The notes under the pricing table, shared by both files. */
export const PLANES_NOTAS = [
  'Los precios son más IVA (16 %).',
  ANUAL_NOTA,
  'Empiezas gratis con Xangarrito, sin tarjeta, y cambias de plan cuando quieras.',
  `Pago: ${PAGO_LINEA}.`,
  'Ninguna venta se bloquea por límites: avisamos al dueño con tiempo.',
];
