import { InMemoryEmployeesRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeEmployeesRepositoryContract } from '../src/contract/index.js';

describeEmployeesRepositoryContract('InMemoryEmployeesRepository', () => {
  return new InMemoryEmployeesRepository(TEST_DEVICE_ID);
});
