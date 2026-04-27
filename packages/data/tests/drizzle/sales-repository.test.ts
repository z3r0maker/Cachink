import { DrizzleSalesRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeSalesRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeSalesRepositoryContract('DrizzleSalesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleSalesRepository(db, TEST_DEVICE_ID);
});
