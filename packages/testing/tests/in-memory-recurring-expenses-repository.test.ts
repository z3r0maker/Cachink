import {
  InMemoryRecurringExpensesRepository,
  TEST_DEVICE_ID,
  describeRecurringExpensesRepositoryContract,
} from '../src/index.js';

describeRecurringExpensesRepositoryContract('InMemoryRecurringExpensesRepository', () => {
  return new InMemoryRecurringExpensesRepository(TEST_DEVICE_ID);
});
