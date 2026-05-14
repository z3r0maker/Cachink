import { InMemoryCajaTurnosRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeCajaTurnosRepositoryContract } from '../src/contract/index.js';

describeCajaTurnosRepositoryContract('InMemoryCajaTurnosRepository', () => {
  return new InMemoryCajaTurnosRepository(TEST_DEVICE_ID);
});
