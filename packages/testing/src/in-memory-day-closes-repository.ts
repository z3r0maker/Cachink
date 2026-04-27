/**
 * In-memory {@link DayClosesRepository}.
 */

import type {
  BusinessId,
  DayClose,
  DayCloseId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewDayClose,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { DayClosesRepository } from '@cachink/data';

export class InMemoryDayClosesRepository implements DayClosesRepository {
  private readonly rows = new Map<DayCloseId, DayClose>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewDayClose): Promise<DayClose> {
    const id = newEntityId<DayCloseId>();
    const ts = now();
    const diferencia = input.efectivoContadoCentavos - input.efectivoEsperadoCentavos;
    const row: DayClose = {
      id,
      fecha: input.fecha,
      efectivoEsperadoCentavos: input.efectivoEsperadoCentavos,
      efectivoContadoCentavos: input.efectivoContadoCentavos,
      diferenciaCentavos: diferencia,
      explicacion: input.explicacion ?? null,
      cerradoPor: input.cerradoPor,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: DayCloseId): Promise<DayClose | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findByDate(date: IsoDate, deviceId: DeviceId): Promise<DayClose | null> {
    return (
      [...this.rows.values()].find(
        (r) => r.fecha === date && r.deviceId === deviceId && r.deletedAt === null,
      ) ?? null
    );
  }

  async findLatest(businessId: BusinessId): Promise<DayClose | null> {
    const candidates = [...this.rows.values()]
      .filter((r) => r.businessId === businessId && r.deletedAt === null)
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
        return b.createdAt.localeCompare(a.createdAt);
      });
    return candidates[0] ?? null;
  }

  async findByDateRange(
    from: IsoDate,
    to: IsoDate,
    businessId: BusinessId,
  ): Promise<readonly DayClose[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId && r.deletedAt === null && r.fecha >= from && r.fecha <= to,
      )
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return b.fecha.localeCompare(a.fecha);
        return b.createdAt.localeCompare(a.createdAt);
      });
  }

  async delete(id: DayCloseId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
