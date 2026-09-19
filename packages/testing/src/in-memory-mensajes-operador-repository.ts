/**
 * In-memory implementation of {@link MensajesOperadorRepository}.
 */

import type { BusinessId, MensajeOperador, MensajeOperadorId, UserId } from '@xangarro/domain';
import type { MensajeOperadorInput, MensajesOperadorRepository } from '@xangarro/data';

export class InMemoryMensajesOperadorRepository implements MensajesOperadorRepository {
  private readonly rows = new Map<MensajeOperadorId, MensajeOperador>();

  async create(input: MensajeOperadorInput): Promise<MensajeOperador> {
    const existing = this.rows.get(input.id);
    if (existing) return existing; // a re-pulled message is the same row
    const row: MensajeOperador = {
      id: input.id,
      operadorId: input.operadorId,
      cajaTurnoId: input.cajaTurnoId as MensajeOperador['cajaTurnoId'],
      severidad: input.severidad,
      cuerpo: input.cuerpo,
      businessId: input.businessId,
      deviceId: input.deviceId as MensajeOperador['deviceId'],
      createdByUserId: input.createdByUserId as MensajeOperador['createdByUserId'],
      createdAt: input.createdAt as MensajeOperador['createdAt'],
      updatedAt: input.updatedAt as MensajeOperador['updatedAt'],
      deletedAt: input.deletedAt as MensajeOperador['deletedAt'],
    };
    this.rows.set(row.id, row);
    return row;
  }

  async findById(id: MensajeOperadorId): Promise<MensajeOperador | null> {
    return this.rows.get(id) ?? null;
  }

  async findByOperador(
    businessId: BusinessId,
    operadorId: UserId,
  ): Promise<readonly MensajeOperador[]> {
    return [...this.rows.values()]
      .filter((r) => r.businessId === businessId && r.operadorId === operadorId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}
