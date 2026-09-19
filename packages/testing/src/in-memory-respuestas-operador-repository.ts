/**
 * In-memory implementation of {@link RespuestasOperadorRepository}.
 */

import type {
  DeviceId,
  MensajeOperadorId,
  RespuestaOperador,
  RespuestaOperadorId,
  UserId,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type { NewRespuestaOperador, RespuestasOperadorRepository } from '@xangarro/data';

export class InMemoryRespuestasOperadorRepository implements RespuestasOperadorRepository {
  private readonly rows = new Map<RespuestaOperadorId, RespuestaOperador>();

  constructor(private readonly deviceId: DeviceId = newEntityId<DeviceId>()) {}

  async create(input: NewRespuestaOperador): Promise<RespuestaOperador> {
    const id = newEntityId<RespuestaOperadorId>();
    const ts = now();
    const row: RespuestaOperador = {
      id,
      mensajeId: input.mensajeId,
      texto: input.texto,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdByUserId: null as UserId | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: RespuestaOperadorId): Promise<RespuestaOperador | null> {
    return this.rows.get(id) ?? null;
  }

  async findByMensaje(mensajeId: MensajeOperadorId): Promise<readonly RespuestaOperador[]> {
    return [...this.rows.values()]
      .filter((r) => r.mensajeId === mensajeId && r.deletedAt === null)
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
  }
}
