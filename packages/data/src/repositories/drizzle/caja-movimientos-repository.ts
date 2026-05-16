/**
 * Drizzle-backed {@link CajaMovimientosRepository}.
 *
 * Part of the Caja Completa feature.
 */

import { and, asc, eq, gte, isNull, lte } from 'drizzle-orm';
import type {
  BusinessId,
  CajaMovimiento,
  CajaMovimientoId,
  CajaMovimientoTipo,
  CajaTurnoId,
  DeviceId,
  IsoTimestamp,
  Money,
  NewCajaMovimiento,
  UserId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CajaMovimientosRepository } from '../caja-movimientos-repository.js';
import { cajaMovimientos } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type MovRow = typeof cajaMovimientos.$inferSelect;

export class DrizzleCajaMovimientosRepository
  implements CajaMovimientosRepository
{
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(
    db: CachinkDatabase,
    deviceId: DeviceId,
    userId: UserId | null = null,
  ) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: NewCajaMovimiento): Promise<CajaMovimiento> {
    const id = newEntityId<CajaMovimientoId>();
    const ts = now();
    const row = {
      id,
      turnoId: input.turnoId,
      tipo: input.tipo,
      montoCentavos: input.montoCentavos,
      motivo: input.motivo,
      userId: input.userId,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(cajaMovimientos).values(row).run();
    return this.#mapRow(row);
  }

  async findById(
    id: CajaMovimientoId,
  ): Promise<CajaMovimiento | null> {
    const row = await this.#db
      .select()
      .from(cajaMovimientos)
      .where(
        and(eq(cajaMovimientos.id, id), isNull(cajaMovimientos.deletedAt)),
      )
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByTurno(
    turnoId: CajaTurnoId,
  ): Promise<readonly CajaMovimiento[]> {
    const rows = await this.#db
      .select()
      .from(cajaMovimientos)
      .where(
        and(
          eq(cajaMovimientos.turnoId, turnoId),
          isNull(cajaMovimientos.deletedAt),
        ),
      )
      .orderBy(asc(cajaMovimientos.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CajaMovimiento[]> {
    const rows = await this.#db
      .select()
      .from(cajaMovimientos)
      .where(
        and(
          eq(cajaMovimientos.businessId, businessId),
          isNull(cajaMovimientos.deletedAt),
          gte(cajaMovimientos.createdAt, from),
          lte(cajaMovimientos.createdAt, to + 'Z'),
        ),
      )
      .orderBy(asc(cajaMovimientos.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  #mapRow(row: MovRow): CajaMovimiento {
    return {
      id: row.id as CajaMovimientoId,
      turnoId: row.turnoId as CajaTurnoId,
      tipo: row.tipo as CajaMovimientoTipo,
      montoCentavos: row.montoCentavos as Money,
      motivo: row.motivo,
      userId: row.userId as UserId,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
