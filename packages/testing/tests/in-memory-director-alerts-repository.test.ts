import { InMemoryDirectorAlertsRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeDirectorAlertsRepositoryContract } from '../src/contract/index.js';

describeDirectorAlertsRepositoryContract('InMemoryDirectorAlertsRepository', () => {
  return new InMemoryDirectorAlertsRepository(TEST_DEVICE_ID);
});
