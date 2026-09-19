/**
 * MensajesOperadorRepository — owner→operator messages (ADR-075).
 *
 * On a device the rows arrive by pull (`mensajes_operador` is DOWN): the
 * pull applier writes them and Avisos reads them. The portal writes through
 * its own Postgres repository, not this one.
 */

import type { MensajeOperador } from '@xangarro/domain';
import type { BusinessId, MensajeOperadorId, UserId } from '@xangarro/domain';

export type { MensajeOperador };

/** A message as it travels from the wire into the device's table. */
export interface MensajeOperadorInput {
  readonly id: MensajeOperadorId;
  readonly operadorId: UserId;
  readonly cajaTurnoId: string | null;
  readonly severidad: 'info' | 'aclaracion';
  readonly cuerpo: string;
  readonly businessId: BusinessId;
  readonly deviceId: string;
  readonly createdByUserId: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
}

export interface MensajesOperadorRepository {
  /** Insert a pulled message. Re-inserting the same id is a no-op. */
  create(input: MensajeOperadorInput): Promise<MensajeOperador>;

  /** Look up a message by ID. Returns null if not found. */
  findById(id: MensajeOperadorId): Promise<MensajeOperador | null>;

  /** An operator's messages, newest first — the Avisos «De Pedro» tab. */
  findByOperador(businessId: BusinessId, operadorId: UserId): Promise<readonly MensajeOperador[]>;
}
