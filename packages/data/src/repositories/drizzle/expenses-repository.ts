/**
 * Drizzle-backed {@link ExpensesRepository}. Mirrors the Sales repo
 * patterns: one `#rowFor` write helper, one `#mapRow` read helper.
 */

import { and, desc, eq, gte, isNull, like, lte } from 'drizzle-orm';
import type {
  BusinessId,
  DeviceId,
  ExpenseCategory,
  ExpenseId,
  IsoDate,
  IsoTimestamp,
  NewExpense,
  RecurringExpenseId,
} from '@cachink/domain';
import { newEntityId, now } from '@cachink/domain';
import type { Expense, ExpensesRepository } from '../expenses-repository.js';
import { expenses } from '../../schema/index.js';
import type { CachinkDatabase } from './_db.js';

type ExpenseRow = typeof expenses.$inferSelect;

export class DrizzleExpensesRepository implements ExpensesRepository {
  readonly #db: CachinkDatabase;
  readonly #deviceId: DeviceId;

  constructor(db: CachinkDatabase, deviceId: DeviceId) {
    this.#db = db;
    this.#deviceId = deviceId;
  }

  async create(input: NewExpense): Promise<Expense> {
    const id = newEntityId<ExpenseId>();
    const ts = now();
    const row = {
      id,
      fecha: input.fecha,
      concepto: input.concepto,
      categoria: input.categoria,
      monto: input.monto,
      proveedor: input.proveedor ?? null,
      gastoRecurrenteId: input.gastoRecurrenteId ?? null,
      businessId: input.businessId,
      deviceId: this.#deviceId,
      createdAt: ts,
      updatedAt: ts,
      deletedAt: null as string | null,
    };
    await this.#db.insert(expenses).values(row).run();
    return this.#mapRow(row);
  }

  async findById(id: ExpenseId): Promise<Expense | null> {
    const row = await this.#db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), isNull(expenses.deletedAt)))
      .get();
    return row ? this.#mapRow(row) : null;
  }

  async findByDate(date: IsoDate, businessId: BusinessId): Promise<readonly Expense[]> {
    const rows = await this.#db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.fecha, date),
          eq(expenses.businessId, businessId),
          isNull(expenses.deletedAt),
        ),
      )
      .orderBy(desc(expenses.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByMonth(yearMonth: string, businessId: BusinessId): Promise<readonly Expense[]> {
    const rows = await this.#db
      .select()
      .from(expenses)
      .where(
        and(
          like(expenses.fecha, `${yearMonth}-%`),
          eq(expenses.businessId, businessId),
          isNull(expenses.deletedAt),
        ),
      )
      .orderBy(desc(expenses.createdAt))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async findByCategory(
    categoria: ExpenseCategory,
    businessId: BusinessId,
    from: IsoDate,
    to: IsoDate,
  ): Promise<readonly Expense[]> {
    const rows = await this.#db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.categoria, categoria),
          eq(expenses.businessId, businessId),
          gte(expenses.fecha, from),
          lte(expenses.fecha, to),
          isNull(expenses.deletedAt),
        ),
      )
      .orderBy(desc(expenses.fecha))
      .all();
    return rows.map((r) => this.#mapRow(r));
  }

  async delete(id: ExpenseId): Promise<void> {
    const ts = now();
    await this.#db
      .update(expenses)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(expenses.id, id))
      .run();
  }

  #mapRow(row: ExpenseRow): Expense {
    return {
      id: row.id as ExpenseId,
      fecha: row.fecha as IsoDate,
      concepto: row.concepto,
      categoria: row.categoria,
      monto: row.monto,
      proveedor: row.proveedor,
      gastoRecurrenteId: (row.gastoRecurrenteId ?? null) as RecurringExpenseId | null,
      businessId: row.businessId as BusinessId,
      deviceId: row.deviceId as DeviceId,
      createdAt: row.createdAt as IsoTimestamp,
      updatedAt: row.updatedAt as IsoTimestamp,
      deletedAt: (row.deletedAt ?? null) as IsoTimestamp | null,
    };
  }
}
