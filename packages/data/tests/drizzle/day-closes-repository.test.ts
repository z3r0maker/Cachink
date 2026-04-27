import { DrizzleDayClosesRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeDayClosesRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeDayClosesRepositoryContract('DrizzleDayClosesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleDayClosesRepository(db, TEST_DEVICE_ID);
});
