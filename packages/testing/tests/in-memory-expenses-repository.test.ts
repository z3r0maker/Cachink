import { InMemoryExpensesRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeExpensesRepositoryContract } from '../src/contract/index.js';

describeExpensesRepositoryContract('InMemoryExpensesRepository', () => {
  return new InMemoryExpensesRepository(TEST_DEVICE_ID);
});
