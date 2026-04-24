import {
  InMemoryClientsRepository,
  TEST_DEVICE_ID,
  describeClientsRepositoryContract,
} from '../src/index.js';

describeClientsRepositoryContract('InMemoryClientsRepository', () => {
  return new InMemoryClientsRepository(TEST_DEVICE_ID);
});
