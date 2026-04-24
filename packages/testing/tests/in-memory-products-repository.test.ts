import {
  InMemoryProductsRepository,
  TEST_DEVICE_ID,
  describeProductsRepositoryContract,
} from '../src/index.js';

describeProductsRepositoryContract('InMemoryProductsRepository', () => {
  return new InMemoryProductsRepository(TEST_DEVICE_ID);
});
