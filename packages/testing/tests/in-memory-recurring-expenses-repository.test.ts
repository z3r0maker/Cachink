import { InMemoryRecurringExpensesRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeRecurringExpensesRepositoryContract } from '../src/contract/index.js';

describeRecurringExpensesRepositoryContract('InMemoryRecurringExpensesRepository', () => {
  return new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
});
