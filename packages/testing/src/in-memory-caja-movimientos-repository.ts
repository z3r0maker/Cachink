/**
 * In-memory implementation of {@link CajaMovimientosRepository}.
 *
 * Part of the Caja Completa feature.
 */

import type {
  BusinessId,
  CajaMovimiento,
  CajaMovimientoId,
  CajaTurnoId,
  DeviceId,
  NewCajaMovimiento,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { CajaMovimientosRepository } from '@cachink/data';

export class InMemoryCajaMovimientosRepository
  implements CajaMovimientosRepository
{
  private readonly rows = new Map<CajaMovimientoId, CajaMovimiento>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewCajaMovimiento): Promise<CajaMovimiento> {
    const id = newEntityId<CajaMovimientoId>();
    const ts = now();
    const row: CajaMovimiento = {
      id,
      turnoId: input.turnoId,
      tipo: input.tipo,
      montoCentavos: input.montoCentavos,
      motivo: input.motivo,
      userId: input.userId,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdByUserId: null,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(
    id: CajaMovimientoId,
  ): Promise<CajaMovimiento | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findByTurno(
    turnoId: CajaTurnoId,
  ): Promise<readonly CajaMovimiento[]> {
    return [...this.rows.values()]
      .filter(
        (r) => r.turnoId === turnoId && r.deletedAt === null,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CajaMovimiento[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId &&
          r.deletedAt === null &&
          r.createdAt >= from &&
          r.createdAt <= to + 'Z',
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  /** Test helper: wipe all records. */
  _reset(): void {
    this.rows.clear();
  }
}
