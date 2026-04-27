/**
 * Drizzle-backed {@link DayClosesRepository}.
 */

import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type {
  BusinessId,
  DayCloseId,
  DayCloseRole,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewDayClose,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { DayClose, DayClosesRepository } from '../day-closes-repository.js';
import { dayCloses } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type DayCloseRow = typeof dayCloses.$inferSelect;

export class DrizzleDayClosesRepository implements DayClosesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewDayClose): Promise<DayClose> {
    const id = newEntityId<DayCloseId>();
    const ts = now();
    const diferencia = input.efectivoContadoCentavos - input.efectivoEsperadoCentavos;
    const row = {
      id,
      fecha: input.fecha,
      efectivoEsperadoCentavos: input.efectivoEsperadoCentavos,
      efectivoContadoCentavos: input.efectivoContadoCentavos,
      diferenciaCentavos: diferencia,
      explicacion: input.explicacion ?? null,
      cerradoPor: input.cerradoPor,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(dayCloses).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: DayCloseId): Promise<DayClose | null> {
    const row = await this.#db
      .select()
      .from(dayCloses)
      .where(and(eq(dayCloses.id, id), isNull(dayCloses.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByDate(date: IsoDate, deviceId: DeviceId): Promise<DayClose | null> {
    const row = await this.#db
      .select()
      .from(dayCloses)
      .where(
        and(
          eq(dayCloses.fecha, date),
          eq(dayCloses.deviceId, deviceId),
          isNull(dayCloses.deletedAt),
        ),
      )
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findLatest(businessId: BusinessId): Promise<DayClose | null> {
    const row = await this.#db
      .select()
      .from(dayCloses)
      .where(and(eq(dayCloses.businessId, businessId), isNull(dayCloses.deletedAt)))
      .orderBy(desc(dayCloses.fecha), desc(dayCloses.createdAt))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly DayClose[]> {
    const rows = await this.#db
      .select()
      .from(dayCloses)
      .where(
        and(
          gte(dayCloses.fecha, from),
          lte(dayCloses.fecha, to),
          eq(dayCloses.businessId, businessId),
          isNull(dayCloses.deletedAt),
        ),
      )
      .orderBy(desc(dayCloses.fecha), desc(dayCloses.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async delete(id: DayCloseId): Promise<void> {
    const ts = now();
    await this.#db
      .update(dayCloses)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(dayCloses.id, id))
      .run();
  }

  #mapRow(row: DayCloseRow): DayClose {
    return {
      id: row.id as DayCloseId,
      fecha: row.fecha as IsoDate,
      efectivoEsperadoCentavos: row.efectivoEsperadoCentavos,
      efectivoContadoCentavos: row.efectivoContadoCentavos,
      diferenciaCentavos: row.diferenciaCentavos,
      explicacion: row.explicacion,
      cerradoPor: row.cerradoPor as DayCloseRole,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
