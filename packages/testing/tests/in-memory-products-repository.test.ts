import { InMemoryProductsRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeProductsRepositoryContract } from '../src/contract/index.js';

describeProductsRepositoryContract('InMemoryProductsRepository', () => {
  return new InMemoryProductsRepository(TEST_DEVICE_ID);
});
