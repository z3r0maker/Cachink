import { DrizzleClientsRepository } from '../../src/repositories/drizzle/index.js';
import {
  TEST_DEVICE_ID,
  describeClientsRepositoryContract,
} from '../../../testing/src/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeClientsRepositoryContract('DrizzleClientsRepository', () => {
  const db = makeFreshDb();
  return new DrizzleClientsRepository(db, TEST_DEVICE_ID);
});
