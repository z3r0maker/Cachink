import { beforeEach, describe, expect, it } from 'vitest';
import type { BusinessId, NewExpense, RecurringExpenseId } from '@cachink/domain';
import {
  InMemoryExpensesRepository,
  InMemoryRecurringExpensesRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
  makeNewRecurringExpense,
} from '../../testing/src/index.js';
import { RegistrarEgresoUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

describe('RegistrarEgresoUseCase', () => {
  let expenses: InMemoryExpensesRepository;
  let recurring: InMemoryRecurringExpensesRepository;
  let useCase: RegistrarEgresoUseCase;

  beforeEach(() => {
    expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    recurring = new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
    useCase = new RegistrarEgresoUseCase(expenses, recurring);
  });

  it('persists an egreso without gastoRecurrenteId', async () => {
    const row = await useCase.execute(makeNewExpense({ businessId: BIZ }));
    expect(await expenses.findById(row.id)).toEqual(row);
  });

  it('accepts a valid gastoRecurrenteId pointing to an active template', async () => {
    const template = await recurring.create(makeNewRecurringExpense({ businessId: BIZ }));
    const row = await useCase.execute(
      makeNewExpense({ businessId: BIZ, gastoRecurrenteId: template.id }),
    );
    expect(row.gastoRecurrenteId).toBe(template.id);
  });

  it('rejects gastoRecurrenteId that does not exist', async () => {
    const input = makeNewExpense({
      businessId: BIZ,
      gastoRecurrenteId: '01HZ8XQN9GZJXV8AKQ5X0C7ZZZ' as RecurringExpenseId,
    });
    await expect(useCase.execute(input)).rejects.toThrow(/no existe/);
  });

  it('rejects a gastoRecurrenteId that points to an inactive template', async () => {
    const template = await recurring.create(
      makeNewRecurringExpense({ businessId: BIZ, activo: false }),
    );
    const input = makeNewExpense({ businessId: BIZ, gastoRecurrenteId: template.id });
    await expect(useCase.execute(input)).rejects.toThrow(/inactivo/);
  });

  it('Zod rejections propagate (e.g. invalid categoria)', async () => {
    const input = { ...makeNewExpense({ businessId: BIZ }), categoria: 'NoExiste' } as unknown as NewExpense;
    await expect(useCase.execute(input)).rejects.toThrow();
  });
});
