/**
 * In-memory {@link RecurringExpensesRepository}.
 */

import type {
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewRecurringExpense,
  RecurringExpense,
  RecurringExpenseId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { RecurringExpensesRepository } from '@cachink/data';

export class InMemoryRecurringExpensesRepository implements RecurringExpensesRepository {
  private readonly rows = new Map<RecurringExpenseId, RecurringExpense>();
  private readonly deviceId: DeviceId;

  constructor(deviceId: DeviceId = newEntityId<DeviceId>()) {
    this.deviceId = deviceId;
  }

  async create(input: NewRecurringExpense): Promise<RecurringExpense> {
    const id = newEntityId<RecurringExpenseId>();
    const ts = now();
    const row: RecurringExpense = {
      id,
      concepto: input.concepto,
      categoria: input.categoria,
      montoCentavos: input.montoCentavos,
      proveedor: input.proveedor ?? null,
      frecuencia: input.frecuencia,
      diaDelMes: input.diaDelMes ?? null,
      diaDeLaSemana: input.diaDeLaSemana ?? null,
      proximoDisparo: input.proximoDisparo,
      activo: input.activo ?? true,
      businessId: input.businessId,
      deviceId: this.deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null,
    };
    this.rows.set(id, row);
    return row;
  }

  async findById(id: RecurringExpenseId): Promise<RecurringExpense | null> {
    const row = this.rows.get(id);
    if (!row || row.deletedAt !== null) return null;
    return row;
  }

  async findDue(today: IsoDate, businessId: BusinessId): Promise<readonly RecurringExpense[]> {
    return [...this.rows.values()]
      .filter(
        (r) =>
          r.businessId === businessId &&
          r.activo &&
          r.deletedAt === null &&
          r.proximoDisparo <= today,
      )
      .sort((a, b) => a.proximoDisparo.localeCompare(b.proximoDisparo));
  }

  async markFired(id: RecurringExpenseId, nextProximoDisparo: IsoDate): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    this.rows.set(id, {
      ...existing,
      proximoDisparo: nextProximoDisparo,
      updatedAt: now(),
    });
  }

  async delete(id: RecurringExpenseId): Promise<void> {
    const existing = this.rows.get(id);
    if (!existing) return;
    const ts: IsoTimestamp = now();
    this.rows.set(id, { ...existing, deletedAt: ts, updatedAt: ts });
  }
}
