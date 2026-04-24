import { DrizzleInventoryMovementsRepository } from '../../src/repositories/drizzle/index.js';
import {
  TEST_DEVICE_ID,
  describeInventoryMovementsRepositoryContract,
} from '../../../testing/src/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeInventoryMovementsRepositoryContract('DrizzleInventoryMovementsRepository', () => {
  const db = makeFreshDb();
  return new DrizzleInventoryMovementsRepository(db, TEST_DEVICE_ID);
});
