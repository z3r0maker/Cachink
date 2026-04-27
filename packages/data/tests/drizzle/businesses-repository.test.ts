import { DrizzleBusinessesRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeBusinessesRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeBusinessesRepositoryContract('DrizzleBusinessesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleBusinessesRepository(db, TEST_DEVICE_ID);
});
