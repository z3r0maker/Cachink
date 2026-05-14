import { InMemoryUsersRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeUsersRepositoryContract } from '../src/contract/index.js';

describeUsersRepositoryContract('InMemoryUsersRepository', () => {
  return new InMemoryUsersRepository(TEST_DEVICE_ID);
});
