import { InMemoryBusinessesRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeBusinessesRepositoryContract } from '../src/contract/index.js';

describeBusinessesRepositoryContract('InMemoryBusinessesRepository', () => {
  return new InMemoryBusinessesRepository(TEST_DEVICE_ID);
});
