/**
 * The reply's own words (M-09), shared so the phone and the web's reply box
 * (`operador/avisos/reply.tsx`) say the same thing: the quick answers, what
 * makes a reply valid, and the toast that confirms it. Pure, tested here.
 */

import { mayuscula } from '../comun/dueno';

/** A quick answer: the chip's short label and the sentence it writes. */
export interface RespuestaRapida {
  readonly label: string;
  readonly texto: string;
}

/** What usually happened when a corte does not cuadrar; one tap fills the box. */
export const RESPUESTAS_RAPIDAS: readonly RespuestaRapida[] = [
  { label: 'Di cambio de más', texto: 'Creo que di cambio de más a un cliente.' },
  { label: 'Cobré y no capturé', texto: 'Cobré una venta y no la capturé en la caja.' },
  { label: 'Salió un vale', texto: 'Salió un vale de la caja y no lo registré como gasto.' },
  { label: 'No sé qué pasó', texto: 'No sé qué pasó, no recuerdo nada fuera de lo normal.' },
];

/** The shortest reply worth sending (the web's form enables at four). */
export const RESPUESTA_MIN = 4;
export const RESPUESTA_MAX = 500;

/** null when it can go; the reason it cannot, as a red note under the box. */
export function respuestaInvalida(texto: string): string | null {
  const t = texto.trim();
  if (t.length === 0) return 'Escríbele algo, aunque sea «no sé qué pasó».';
  if (t.length < RESPUESTA_MIN) return 'Cuéntale un poco más para que le sirva.';
  if (t.length > RESPUESTA_MAX) return `Máximo ${RESPUESTA_MAX} caracteres.`;
  return null;
}

/** «Pedro ya tiene tu respuesta sobre el corte del 13 de mayo.» */
export function toastRespuesta(dueno: string, asunto: string): string {
  return `${mayuscula(dueno)} ya tiene tu respuesta sobre ${asunto}.`;
}
