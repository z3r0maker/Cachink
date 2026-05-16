import { DrizzleConversionRecetasRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeConversionRecetasRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeConversionRecetasRepositoryContract('DrizzleConversionRecetasRepository', () => {
  const db = makeFreshDb();
  return new DrizzleConversionRecetasRepository(db, TEST_DEVICE_ID);
});
