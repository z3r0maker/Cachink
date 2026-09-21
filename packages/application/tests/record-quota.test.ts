import { describe, expect, it } from 'vitest';
import type { BusinessId } from '@xangarro/domain';
import {
  InMemoryExpensesRepository,
  InMemoryRecordUsageRepository,
  InMemoryRecurringExpensesRepository,
  TEST_DEVICE_ID,
  makeNewExpense,
} from '../../testing/src/index.js';
import { PlanRecordQuota, RegistrarEgresoUseCase } from '../src/index.js';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;

function quota(used: number, transactionsPerMonth: number) {
  const usage = new InMemoryRecordUsageRepository();
  usage.setCount(used);
  return new PlanRecordQuota({
    usage,
    businessId: BIZ,
    plan: 'xangarrito',
    transactionsPerMonth,
    yearMonth: '2026-09',
  });
}

describe('PlanRecordQuota (A-10 → N-04: advisory)', () => {
  it('never blocks, even past the limit', async () => {
    await expect(quota(301, 300).assertCanCreate()).resolves.toBeUndefined();
  });

  it('warns at and past the limit, not below it', async () => {
    await expect(quota(299, 300).warning()).resolves.toBeNull();
    await expect(quota(300, 300).warning()).resolves.toEqual({
      plan: 'xangarrito',
      limit: 300,
      used: 300,
    });
  });

  it('a high tier breathes far beyond xangarrito', async () => {
    await expect(quota(10_000, 30_000).assertCanCreate()).resolves.toBeUndefined();
  });

  it('a capture over the limit still writes — the sheet warns after (N-04)', async () => {
    const expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    const useCase = new RegistrarEgresoUseCase(
      expenses,
      new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID),
      quota(300, 300),
    );
    await expect(useCase.execute(makeNewExpense({ businessId: BIZ }))).resolves.toBeDefined();
    expect(await expenses.findByDate('2026-04-23' as never, BIZ)).toHaveLength(1);
  });
});
