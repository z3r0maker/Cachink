import { DrizzleConversionsRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeConversionsRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeConversionsRepositoryContract('DrizzleConversionsRepository', () => {
  const db = makeFreshDb();
  return new DrizzleConversionsRepository(db, TEST_DEVICE_ID);
});
