/**
 * Drizzle-backed {@link CajaTurnosRepository}.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type {
  BusinessId,
  CajaTurno,
  CajaTurnoId,
  DeviceId,
  DiscrepancyReason,
  ExpenseId,
  IsoDate,
  IsoTimestamp,
  UserId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type {
  CajaTurnoPatch,
  CajaTurnosRepository,
  CreateCajaTurnoInput,
} from '../caja-turnos-repository.js';
import { cajaTurnos } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type TurnoRow = typeof cajaTurnos.$inferSelect;

export class DrizzleCajaTurnosRepository
  implements CajaTurnosRepository
{
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;
  readonly #userId: UserId | null;

  constructor(db: CachinkDatabase, deviceId: DeviceId, userId: UserId | null = null) {
    this.#db = db;
    this.#deviceId = deviceId;
    this.#userId = userId;
  }

  async create(input: CreateCajaTurnoInput): Promise<CajaTurno> {
    const id = newEntityId<CajaTurnoId>();
    const ts = now();
    const row = {
      id,
      userId: input.userId,
      fecha: input.fecha,
      aperturaAt: input.aperturaAt,
      cierreAt: null as string | null,
      montoAperturaCentavos: input.montoAperturaCentavos,
      efectivoAdicionalCentavos: input.efectivoAdicionalCentavos,
      montoCierreCentavos: null as bigint | null,
      efectivoEsperadoCentavos: null as bigint | null,
      diferenciaCentavos: null as bigint | null,
      discrepancyReason: null as string | null,
      explicacion: null as string | null,
      totalTransferencias: 0n,
      totalTarjeta: 0n,
      totalQr: 0n,
      totalCredito: 0n,
      egresoAutoId: null as string | null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdByUserId: (this.#userId ?? null) as string | null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(cajaTurnos).values(row).run();
    return this.#mapRow(row as unknown as TurnoRow);
  }

  async findById(id: CajaTurnoId): Promise<CajaTurno | null> {
    const row = await this.#db
      .select()
      .from(cajaTurnos)
      .where(and(eq(cajaTurnos.id, id), isNull(cajaTurnos.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findOpenByUser(userId: UserId): Promise<CajaTurno | null> {
    const row = await this.#db
      .select()
      .from(cajaTurnos)
      .where(
        and(
          eq(cajaTurnos.userId, userId),
          isNull(cajaTurnos.cierreAt),
          isNull(cajaTurnos.deletedAt),
        ),
      )
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findLatest(businessId: BusinessId): Promise<CajaTurno | null> {
    const row = await this.#db
      .select()
      .from(cajaTurnos)
      .where(
        and(
          eq(cajaTurnos.businessId, businessId),
          isNull(cajaTurnos.deletedAt),
        ),
      )
      .orderBy(desc(cajaTurnos.createdAt))
      .limit(1)
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CajaTurno[]> {
    const rows = await this.#db
      .select()
      .from(cajaTurnos)
      .where(
        and(
          eq(cajaTurnos.businessId, businessId),
          gte(cajaTurnos.fecha, from),
          lte(cajaTurnos.fecha, to),
          isNull(cajaTurnos.deletedAt),
        ),
      )
      .orderBy(desc(cajaTurnos.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async update(id: CajaTurnoId, patch: CajaTurnoPatch): Promise<CajaTurno> {
    const ts = now();
    const set: Record<string, unknown> = { updatedAt: ts };
    const keys: (keyof CajaTurnoPatch)[] = [
      'cierreAt', 'montoCierreCentavos', 'efectivoEsperadoCentavos',
      'diferenciaCentavos', 'discrepancyReason', 'explicacion',
      'totalTransferencias', 'totalTarjeta', 'totalQr', 'totalCredito', 'egresoAutoId',
    ];
    for (const k of keys) {
      if (patch[k] !== undefined) set[k] = patch[k];
    }
    await this.#db.update(cajaTurnos).set(set).where(eq(cajaTurnos.id, id)).run();
    const row = await this.#db.select().from(cajaTurnos).where(eq(cajaTurnos.id, id)).get();
    if (!row) throw new Error(`CajaTurno ${id} not found`);
    return this.#mapRow(row);
  }

  #mapRow(row: TurnoRow): CajaTurno {
    return {
      id: row.id as CajaTurnoId,
      userId: row.userId as UserId,
      fecha: row.fecha as IsoDate,
      aperturaAt: row.aperturaAt as IsoTimestamp,
      cierreAt: (row.cierreAt ?? null) as IsoTimestamp | null,
      montoAperturaCentavos: row.montoAperturaCentavos,
      efectivoAdicionalCentavos: row.efectivoAdicionalCentavos,
      montoCierreCentavos: row.montoCierreCentavos ?? null,
      efectivoEsperadoCentavos: row.efectivoEsperadoCentavos ?? null,
      diferenciaCentavos: row.diferenciaCentavos ?? null,
      discrepancyReason: (row.discrepancyReason ?? null) as DiscrepancyReason | null,
      explicacion: row.explicacion ?? null,
      totalTransferencias: row.totalTransferencias,
      totalTarjeta: row.totalTarjeta,
      totalQr: row.totalQr,
      totalCredito: row.totalCredito,
      egresoAutoId: (row.egresoAutoId ?? null) as ExpenseId | null,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdByUserId: (row.createdByUserId ?? null) as UserId | null,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
