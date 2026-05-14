/**
 * In-memory implementation of {@link CajaTurnosRepository}.
 *
 * Phase 6 of the Feature Flags plan: Caja.
 */

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
} from '@cachink/data';

export class InMemoryCajaTurnosRepository
  implements CajaTurnosRepository
{
  private readonly rows = new Map<CajaTurnoId, CajaTurno>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: CreateCajaTurnoInput): Promise<CajaTurno> {
    const id = newEntityId<CajaTurnoId>();
    const ts = now();
    const row: CajaTurno = {
      id,
      userId: input.userId,
      fecha: input.fecha as IsoDate,
      aperturaAt: input.aperturaAt as IsoTimestamp,
      cierreAt: null,
      montoAperturaCentavos: input.montoAperturaCentavos,
      efectivoAdicionalCentavos: input.efectivoAdicionalCentavos,
      montoCierreCentavos: null,
      efectivoEsperadoCentavos: null,
      diferenciaCentavos: null,
      discrepancyReason: null,
      explicacion: null,
      totalTransferencias: 0n,
      totalTarjeta: 0n,
      totalQr: 0n,
      totalCredito: 0n,
      egresoAutoId: null,
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

  async findById(id: CajaTurnoId): Promise<CajaTurno | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findOpenByUser(userId: UserId): Promise<CajaTurno | null> {
    for (const row of this.rows.values()) {
      if (
        row.userId === userId &&
        row.cierreAt === null &&
        row.deletedAt === null
      ) {
        return row;
      }
    }
    return null;
  }

  async findLatest(
    businessId: BusinessId,
  ): Promise<CajaTurno | null> {
    const rows = [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId && r.deletedAt === null,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows[0] ?? null;
  }

  async findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CajaTurno[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId &&
          r.deletedAt === null &&
          r.fecha >= from &&
          r.fecha <= to,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async update(
    id: CajaTurnoId,
    patch: CajaTurnoPatch,
  ): Promise<CajaTurno> {
    const existing = this.rows.get(id);
    if (!existing || existing.deletedAt !== null) {
      throw new Error(`CajaTurno ${id} not found`);
    }
    const ts = now();
    const updated: CajaTurno = {
      ...existing,
      ...(patch.cierreAt !== undefined && {
        cierreAt: patch.cierreAt as IsoTimestamp | null,
      }),
      ...(patch.montoCierreCentavos !== undefined && {
        montoCierreCentavos: patch.montoCierreCentavos,
      }),
      ...(patch.efectivoEsperadoCentavos !== undefined && {
        efectivoEsperadoCentavos: patch.efectivoEsperadoCentavos,
      }),
      ...(patch.diferenciaCentavos !== undefined && {
        diferenciaCentavos: patch.diferenciaCentavos,
      }),
      ...(patch.discrepancyReason !== undefined && {
        discrepancyReason: patch.discrepancyReason as DiscrepancyReason | null,
      }),
      ...(patch.explicacion !== undefined && {
        explicacion: patch.explicacion,
      }),
      ...(patch.totalTransferencias !== undefined && {
        totalTransferencias: patch.totalTransferencias,
      }),
      ...(patch.totalTarjeta !== undefined && {
        totalTarjeta: patch.totalTarjeta,
      }),
      ...(patch.totalQr !== undefined && {
        totalQr: patch.totalQr,
      }),
      ...(patch.totalCredito !== undefined && {
        totalCredito: patch.totalCredito,
      }),
      ...(patch.egresoAutoId !== undefined && {
        egresoAutoId: patch.egresoAutoId as ExpenseId | null,
      }),
      updatedAt: ts,
    };
    this.rows.set(id, updated);
    return updated;
  }
}
