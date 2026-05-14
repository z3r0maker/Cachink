import { DrizzleCajaTurnosRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeCajaTurnosRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeCajaTurnosRepositoryContract('DrizzleCajaTurnosRepository', () => {
  const db = makeFreshDb();
  return new DrizzleCajaTurnosRepository(db, TEST_DEVICE_ID);
});
