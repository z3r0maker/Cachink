/**
 * MensajeOperador — a message from the owner to one operator (ADR-075).
 *
 * Written by the portal only («Pedir aclaración» in Cortes de turno, or a
 * plain notice) and pulled by every device; `mensajes_operador` is a DOWN
 * table. An `aclaracion` references the turno it is about and is the one
 * kind the operator answers in place (Avisos shows the reply box for it);
 * read marks are device-local state and never travel.
 */

import { z } from 'zod';
import type { CajaTurnoId, MensajeOperadorId, UserId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

/** `info` is a notice; `aclaracion` asks the operator to answer (ADR-075). */
export const MensajeSeveridadEnum = z.enum(['info', 'aclaracion']);
export type MensajeSeveridad = z.infer<typeof MensajeSeveridadEnum>;

export const MensajeOperadorSchema = z
  .object({
    id: ulidField<MensajeOperadorId>(),
    /** The operator who reads it in Avisos, «De Pedro». */
    operadorId: ulidField<UserId>(),
    /** The turno an aclaración is about; null for a plain notice. */
    cajaTurnoId: ulidField<CajaTurnoId>().nullable(),
    severidad: MensajeSeveridadEnum,
    cuerpo: z.string().min(1).max(1000),
  })
  .merge(auditSchema);

export type MensajeOperador = z.infer<typeof MensajeOperadorSchema>;
