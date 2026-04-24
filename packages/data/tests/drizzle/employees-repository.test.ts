import { DrizzleEmployeesRepository } from '../../src/repositories/drizzle/index.js';
import {
  TEST_DEVICE_ID,
  describeEmployeesRepositoryContract,
} from '../../../testing/src/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeEmployeesRepositoryContract('DrizzleEmployeesRepository', () => {
  const db = makeFreshDb();
  return new DrizzleEmployeesRepository(db, TEST_DEVICE_ID);
});
