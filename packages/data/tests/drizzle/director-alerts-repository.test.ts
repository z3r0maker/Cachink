import { DrizzleDirectorAlertsRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeDirectorAlertsRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeDirectorAlertsRepositoryContract('DrizzleDirectorAlertsRepository', () => {
  const db = makeFreshDb();
  return new DrizzleDirectorAlertsRepository(db, TEST_DEVICE_ID);
});
