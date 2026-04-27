import { DrizzleClientPaymentsRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeClientPaymentsRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeClientPaymentsRepositoryContract('DrizzleClientPaymentsRepository', () => {
  const db = makeFreshDb();
  return new DrizzleClientPaymentsRepository(db, TEST_DEVICE_ID);
});
