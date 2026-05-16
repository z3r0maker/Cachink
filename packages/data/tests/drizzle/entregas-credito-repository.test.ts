import { DrizzleEntregasCreditoRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeEntregasCreditoRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeEntregasCreditoRepositoryContract('DrizzleEntregasCreditoRepository', () => {
  const db = makeFreshDb();
  return new DrizzleEntregasCreditoRepository(db, TEST_DEVICE_ID);
});
