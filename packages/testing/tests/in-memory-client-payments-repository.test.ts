import { InMemoryClientPaymentsRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeClientPaymentsRepositoryContract } from '../src/contract/index.js';

describeClientPaymentsRepositoryContract('InMemoryClientPaymentsRepository', () => {
  return new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
});
