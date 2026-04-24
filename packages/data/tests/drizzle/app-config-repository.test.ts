import { DrizzleAppConfigRepository } from '../../src/repositories/drizzle/index.js';
import { describeAppConfigRepositoryContract } from '../../../testing/src/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeAppConfigRepositoryContract('DrizzleAppConfigRepository', () => {
  const db = makeFreshDb();
  return new DrizzleAppConfigRepository(db);
});
