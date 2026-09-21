import { describe, expect, it } from 'vitest';
import { PlanLimitError, type BusinessId } from '@xangarro/domain';
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

describe('PlanRecordQuota (A-10)', () => {
  it('allows the 50th record of a 50-record plan', async () => {
    await expect(quota(299, 300).assertCanCreate()).resolves.toBeUndefined();
  });

  it('blocks past the limit with PLAN_LIMIT_RECORDS', async () => {
    const err = await quota(300, 300)
      .assertCanCreate()
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PlanLimitError);
    expect(err).toMatchObject({ code: 'PLAN_LIMIT_RECORDS', limit: 300, plan: 'xangarrito' });
  });

  it('a high tier breathes far beyond xangarrito', async () => {
    await expect(quota(10_000, 30_000).assertCanCreate()).resolves.toBeUndefined();
  });

  it('stops a capture use case before it writes anything', async () => {
    const expenses = new InMemoryExpensesRepository(TEST_DEVICE_ID);
    const useCase = new RegistrarEgresoUseCase(
      expenses,
      new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID),
      quota(300, 300),
    );
    await expect(useCase.execute(makeNewExpense({ businessId: BIZ }))).rejects.toBeInstanceOf(
      PlanLimitError,
    );
    expect(await expenses.findByDate('2026-04-23' as never, BIZ)).toEqual([]);
  });
});
