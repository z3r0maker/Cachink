import { DrizzleDayClosesRepository } from '../../src/repositories/drizzle/index.js';
import {
  TEST_DEVICE_ID,
  describeDayClosesRepositoryContract,
} from '../../../testing/src/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeDayClosesRepositoryContract('DrizzleDayClosesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleDayClosesRepository(db, TEST_DEVICE_ID);
});
