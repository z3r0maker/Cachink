import { InMemoryDayClosesRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeDayClosesRepositoryContract } from '../src/contract/index.js';

describeDayClosesRepositoryContract('InMemoryDayClosesRepository', () => {
  return new InMemoryDayClosesRepository(TEST_DEVICE_ID);
});
