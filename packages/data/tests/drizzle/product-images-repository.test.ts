import { DrizzleProductImagesRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeProductImagesRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeProductImagesRepositoryContract('DrizzleProductImagesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleProductImagesRepository(db, TEST_DEVICE_ID);
});
