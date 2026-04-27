import { InMemoryClientsRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeClientsRepositoryContract } from '../src/contract/index.js';

describeClientsRepositoryContract('InMemoryClientsRepository', () => {
  return new InMemoryClientsRepository(TEST_DEVICE_ID);
});
