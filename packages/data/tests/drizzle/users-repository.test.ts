import { DrizzleUsersRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeUsersRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeUsersRepositoryContract('DrizzleUsersRepository', () => {
  const db = makeFreshDb();
  return new DrizzleUsersRepository(db, TEST_DEVICE_ID);
});
