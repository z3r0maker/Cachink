/**
 * Drizzle-backed {@link RespuestasOperadorRepository}. The reply is written
 * once on this device; the change-log trigger feeds the outbox.
 */

import { and, asc, eq, isNull } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  IsoTimestamp,
  MensajeOperadorId,
  RespuestaOperador,
  RespuestaOperadorId,
  UserId,
} from '@xangarro/domain';
import { newEntityId, now } from '@xangarro/domain';
import type {
  NewRespuestaOperador,
  RespuestasOperadorRepository,
} from '../respuestas-operador-repository.js';
import { respuestasOperador } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type RespuestaRow = typeof respuestasOperador.$inferSelect;

export class DrizzleRespuestasOperadorRepository implements RespuestasOperadorRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewRespuestaOperador): Promise<RespuestaOperador> {
    const id = newEntityId<RespuestaOperadorId>();
    const ts = now();
    const row = {
      id,
      mensajeId: input.mensajeId,
      texto: input.texto,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(respuestasOperador).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: RespuestaOperadorId): Promise<RespuestaOperador | null> {
    const row = await this.#db
      .select()
      .from(respuestasOperador)
      .where(eq(respuestasOperador.id, id))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByMensaje(mensajeId: MensajeOperadorId): Promise<readonly RespuestaOperador[]> {
    const rows = await this.#db
      .select()
      .from(respuestasOperador)
      .where(and(eq(respuestasOperador.mensajeId, mensajeId), isNull(respuestasOperador.deletedAt)))
      .orderBy(asc(respuestasOperador.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  #mapRow(row: RespuestaRow): RespuestaOperador {
    return {
      id: row.id as RespuestaOperadorId,
      mensajeId: row.mensajeId as MensajeOperadorId,
      texto: row.texto,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
