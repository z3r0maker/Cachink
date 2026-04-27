import { DrizzleEmployeesRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeEmployeesRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeEmployeesRepositoryContract('DrizzleEmployeesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleEmployeesRepository(db, TEST_DEVICE_ID);
});
