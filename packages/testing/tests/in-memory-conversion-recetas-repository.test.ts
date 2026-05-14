import { InMemoryConversionRecetasRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeConversionRecetasRepositoryContract } from '../src/contract/index.js';

describeConversionRecetasRepositoryContract('InMemoryConversionRecetasRepository', () => {
  return new InMemoryConversionRecetasRepository(TEST_DEVICE_ID);
});
