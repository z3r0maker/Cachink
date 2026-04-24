import {
  InMemoryClientPaymentsRepository,
  TEST_DEVICE_ID,
  describeClientPaymentsRepositoryContract,
} from '../src/index.js';

describeClientPaymentsRepositoryContract('InMemoryClientPaymentsRepository', () => {
  return new InMemoryClientPaymentsRepository(TEST_DEVICE_ID);
});
