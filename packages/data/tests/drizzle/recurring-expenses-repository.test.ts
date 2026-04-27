import { DrizzleRecurringExpensesRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeRecurringExpensesRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeRecurringExpensesRepositoryContract('DrizzleRecurringExpensesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleRecurringExpensesRepository(db, TEST_DEVICE_ID);
});
