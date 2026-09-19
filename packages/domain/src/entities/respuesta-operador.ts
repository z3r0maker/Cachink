/**
 * RespuestaOperador — an operator's answer to a owner message (ADR-075).
 *
 * Written on the device (the Avisos reply box), pushed as one UP row, shown
 * in the owner's Cortes panel. `respuestas_operador` is UP-only: one reply
 * per message — answering again replaces nothing, a new row is a new answer.
 */

import { z } from 'zod';
import type { MensajeOperadorId, RespuestaOperadorId } from '../ids/index.js';
import { ulidField } from './_ulid-field.js';
import { auditSchema } from './_audit.js';

export const RespuestaOperadorSchema = z
  .object({
    id: ulidField<RespuestaOperadorId>(),
    /** The message being answered; must exist in this business. */
    mensajeId: ulidField<MensajeOperadorId>(),
    texto: z.string().min(1).max(500),
  })
  .merge(auditSchema);

export type RespuestaOperador = z.infer<typeof RespuestaOperadorSchema>;
