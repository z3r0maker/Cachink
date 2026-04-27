import { DrizzleExpensesRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeExpensesRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeExpensesRepositoryContract('DrizzleExpensesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleExpensesRepository(db, TEST_DEVICE_ID);
});
