import {
  InMemoryBusinessesRepository,
  TEST_DEVICE_ID,
  describeBusinessesRepositoryContract,
} from '../src/index.js';

describeBusinessesRepositoryContract('InMemoryBusinessesRepository', () => {
  return new InMemoryBusinessesRepository(TEST_DEVICE_ID);
});
