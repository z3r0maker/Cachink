import { InMemorySalesRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeSalesRepositoryContract } from '../src/contract/index.js';

describeSalesRepositoryContract('InMemorySalesRepository', () => {
  return new InMemorySalesRepository(TEST_DEVICE_ID);
});
