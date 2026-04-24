/**
 * Drizzle-backed {@link RecurringExpensesRepository}.
 */

import { and, asc, eq, isNull, lte } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  NewRecurringExpense,
  RecurrenceFrequency,
  RecurringExpenseId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type {
  RecurringExpense,
  RecurringExpensesRepository,
} from '../recurring-expenses-repository.js';
import { recurringExpenses } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type RecurringExpenseRow = typeof recurringExpenses.$inferSelect;

export class DrizzleRecurringExpensesRepository implements RecurringExpensesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewRecurringExpense): Promise<RecurringExpense> {
    const id = newEntityId<RecurringExpenseId>();
    const ts = now();
    const row = {
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
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(recurringExpenses).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: RecurringExpenseId): Promise<RecurringExpense | null> {
    const row = await this.#db
      .select()
      .from(recurringExpenses)
      .where(and(eq(recurringExpenses.id, id), isNull(recurringExpenses.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findDue(today: IsoDate, businessId: BusinessId): Promise<readonly RecurringExpense[]> {
    const rows = await this.#db
      .select()
      .from(recurringExpenses)
      .where(
        and(
          eq(recurringExpenses.businessId, businessId),
          eq(recurringExpenses.activo, true),
          lte(recurringExpenses.proximoDisparo, today),
          isNull(recurringExpenses.deletedAt),
        ),
      )
      .orderBy(asc(recurringExpenses.proximoDisparo))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async markFired(id: RecurringExpenseId, nextProximoDisparo: IsoDate): Promise<void> {
    await this.#db
      .update(recurringExpenses)
      .set({ proximoDisparo: nextProximoDisparo, updatedAt: now() })
      .where(eq(recurringExpenses.id, id))
      .run();
  }

  async delete(id: RecurringExpenseId): Promise<void> {
    const ts = now();
    await this.#db
      .update(recurringExpenses)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(recurringExpenses.id, id))
      .run();
  }

  #mapRow(row: RecurringExpenseRow): RecurringExpense {
    return {
      id: row.id as RecurringExpenseId,
      concepto: row.concepto,
      categoria: row.categoria,
      montoCentavos: row.montoCentavos,
      proveedor: row.proveedor,
      frecuencia: row.frecuencia as RecurrenceFrequency,
      diaDelMes: row.diaDelMes,
      diaDeLaSemana: row.diaDeLaSemana,
      proximoDisparo: row.proximoDisparo as IsoDate,
      activo: row.activo,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
