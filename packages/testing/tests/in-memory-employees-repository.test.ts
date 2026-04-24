import {
  InMemoryEmployeesRepository,
  TEST_DEVICE_ID,
  describeEmployeesRepositoryContract,
} from '../src/index.js';

describeEmployeesRepositoryContract('InMemoryEmployeesRepository', () => {
  return new InMemoryEmployeesRepository(TEST_DEVICE_ID);
});
