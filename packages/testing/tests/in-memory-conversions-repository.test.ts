import { InMemoryConversionsRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeConversionsRepositoryContract } from '../src/contract/index.js';

describeConversionsRepositoryContract('InMemoryConversionsRepository', () => {
  return new InMemoryConversionsRepository(TEST_DEVICE_ID);
});
