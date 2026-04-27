import { DrizzleProductsRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeProductsRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeProductsRepositoryContract('DrizzleProductsRepository', () => {
  const db = makeFreshDb();
  return new DrizzleProductsRepository(db, TEST_DEVICE_ID);
});
