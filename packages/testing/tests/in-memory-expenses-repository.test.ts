import {
  InMemoryExpensesRepository,
  TEST_DEVICE_ID,
  describeExpensesRepositoryContract,
} from '../src/index.js';

describeExpensesRepositoryContract('InMemoryExpensesRepository', () => {
  return new InMemoryExpensesRepository(TEST_DEVICE_ID);
});
