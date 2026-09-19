/**
 * Drizzle-backed {@link MensajesOperadorRepository}. Rows arrive by pull;
 * the applier hands them to `create` as they came off the wire.
 */

import { and, desc, eq } from 'drizzle-orm';
import type {
  BusinessId,
  CajaTurnoId,
  DeviceId,
  IsoTimestamp,
  MensajeOperador,
  MensajeOperadorId,
  MensajeSeveridad,
  UserId,
} from '@xangarro/domain';
import type {
  MensajeOperadorInput,
  MensajesOperadorRepository,
} from '../mensajes-operador-repository.js';
import { mensajesOperador } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type MensajeRow = typeof mensajesOperador.$inferSelect;

export class DrizzleMensajesOperadorRepository implements MensajesOperadorRepository {
  readonly #db: CachinkDatabase;

  constructor(db: CachinkDatabase) {
    this.#db = db;
  }

  async create(input: MensajeOperadorInput): Promise<MensajeOperador> {
    const row = {
      id: input.id,
      operadorId: input.operadorId,
      cajaTurnoId: input.cajaTurnoId,
      severidad: input.severidad,
      cuerpo: input.cuerpo,
      businessId: input.businessId,
      deviceId: input.deviceId,
      createdByUserId: input.createdByUserId,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      deletedAt: input.deletedAt,
    };
    // A re-pulled message is the same row, not a new one.
    await this.#db
      .insert(mensajesOperador)
      .values(row)
      .onConflictDoNothing({ target: mensajesOperador.id })
      .run();
    return this.#mapRow(row);
  }

  async findById(id: MensajeOperadorId): Promise<MensajeOperador | null> {
    const row = await this.#db
      .select()
      .from(mensajesOperador)
      .where(eq(mensajesOperador.id, id))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByOperador(
    businessId: BusinessId,
    operadorId: UserId,
  ): Promise<readonly MensajeOperador[]> {
    const rows = await this.#db
      .select()
      .from(mensajesOperador)
      .where(
        and(
          eq(mensajesOperador.businessId, businessId),
          eq(mensajesOperador.operadorId, operadorId),
        ),
      )
      .orderBy(desc(mensajesOperador.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  #mapRow(row: MensajeRow): MensajeOperador {
    return {
      id: row.id as MensajeOperadorId,
      operadorId: row.operadorId as UserId,
      cajaTurnoId: (row.cajaTurnoId ?? null) as CajaTurnoId | null,
      severidad: row.severidad as MensajeSeveridad,
      cuerpo: row.cuerpo,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
