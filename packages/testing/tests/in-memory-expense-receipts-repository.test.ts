import { InMemoryExpenseReceiptsRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeExpenseReceiptsRepositoryContract } from '../src/contract/index.js';

describeExpenseReceiptsRepositoryContract('InMemoryExpenseReceiptsRepository', () => {
  return new InMemoryExpenseReceiptsRepository(TEST_DEVICE_ID);
});
