/**
 * RespuestasOperadorRepository — an operator's answers to owner messages
 * (ADR-075). UP table: written on the device from the Avisos reply box and
 * pushed once; the owner reads them in the Cortes panel through Postgres.
 */

import type { RespuestaOperador } from '@xangarro/domain';
import type { BusinessId, MensajeOperadorId, RespuestaOperadorId } from '@xangarro/domain';

export type { RespuestaOperador };

/** Input for recording a reply — the message id plus what the operator wrote. */
export interface NewRespuestaOperador {
  readonly mensajeId: MensajeOperadorId;
  readonly texto: string;
  readonly businessId: BusinessId;
}

export interface RespuestasOperadorRepository {
  /** Record the operator's reply and return the persisted row. */
  create(input: NewRespuestaOperador): Promise<RespuestaOperador>;

  /** Look up a reply by ID. Returns null if not found. */
  findById(id: RespuestaOperadorId): Promise<RespuestaOperador | null>;

  /** The replies a message has received, oldest first. */
  findByMensaje(mensajeId: MensajeOperadorId): Promise<readonly RespuestaOperador[]>;
}
