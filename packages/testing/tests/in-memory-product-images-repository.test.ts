import { InMemoryProductImagesRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeProductImagesRepositoryContract } from '../src/contract/index.js';

describeProductImagesRepositoryContract('InMemoryProductImagesRepository', () => {
  return new InMemoryProductImagesRepository(TEST_DEVICE_ID);
});
