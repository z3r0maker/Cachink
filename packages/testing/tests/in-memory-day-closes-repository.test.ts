import {
  InMemoryDayClosesRepository,
  TEST_DEVICE_ID,
  describeDayClosesRepositoryContract,
} from '../src/index.js';

describeDayClosesRepositoryContract('InMemoryDayClosesRepository', () => {
  return new InMemoryDayClosesRepository(TEST_DEVICE_ID);
});
