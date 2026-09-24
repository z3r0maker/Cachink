/**
 * ARCO requests (N-34): what a titular may ask for, and the legal clock.
 *
 * LFPDPPP 2025: the responsable answers within **20 días hábiles** of
 * receiving the request and, when it is granted, makes it effective within
 * the **15 días hábiles** after answering (each extendable once, art. 31).
 * The request counts from the day after it is received, in Mexico City.
 */

import { z } from 'zod';

import type { IsoDate } from '../dates/index.js';
import { hoyEn } from '../dates/periodo.js';
import { sumarDiasHabiles } from './dias-habiles.js';

/** Acceso, rectificación, cancelación, oposición, and revoking consent (art. 8). */
export const DERECHOS_ARCO = [
  'acceso',
  'rectificacion',
  'cancelacion',
  'oposicion',
  'revocacion',
] as const;
export type DerechoArco = (typeof DERECHOS_ARCO)[number];

export const PLAZO_RESPUESTA_DIAS_HABILES = 20;
export const PLAZO_EJECUCION_DIAS_HABILES = 15;

/** What a titular files through the public form or from their account. */
export const SolicitudArcoSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  correo: z.email().max(200),
  derecho: z.enum(DERECHOS_ARCO),
  descripcion: z.string().trim().min(10).max(4000),
});
export type SolicitudArco = z.infer<typeof SolicitudArcoSchema>;

export interface PlazosArco {
  /** The day the request counts as received, in Mexico City. */
  readonly recibida: IsoDate;
  /** Last day to answer: 20 días hábiles after `recibida`. */
  readonly responderA: IsoDate;
  /** Last day to make it effective if the answer were sent on `responderA`. */
  readonly ejecutarA: IsoDate;
}

export function plazosArco(recibidaEn: Date): PlazosArco {
  const recibida = hoyEn(recibidaEn);
  const responderA = sumarDiasHabiles(recibida, PLAZO_RESPUESTA_DIAS_HABILES);
  return {
    recibida,
    responderA,
    ejecutarA: sumarDiasHabiles(responderA, PLAZO_EJECUCION_DIAS_HABILES),
  };
}

/** A deadline day as an instant: 23:59:59 in Mexico City (UTC−6, no DST since 2022). */
export function finDelDiaCdmx(date: IsoDate): string {
  return `${date}T23:59:59-06:00`;
}
