import {
  InMemorySalesRepository,
  TEST_DEVICE_ID,
  describeSalesRepositoryContract,
} from '../src/index.js';

describeSalesRepositoryContract('InMemorySalesRepository', () => {
  return new InMemorySalesRepository(TEST_DEVICE_ID);
});
