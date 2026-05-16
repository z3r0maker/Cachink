import { DrizzleAuditoriasInventarioRepository } from '../../src/repositories/drizzle/index.js';
import { TEST_DEVICE_ID } from '../../../testing/src/index.js';
import { describeAuditoriasInventarioRepositoryContract } from '../../../testing/src/contract/index.js';
import { makeFreshDb } from '../helpers/fresh-db.js';

describeAuditoriasInventarioRepositoryContract('DrizzleAuditoriasInventarioRepository', () => {
  const db = makeFreshDb();
  return new DrizzleAuditoriasInventarioRepository(db, TEST_DEVICE_ID);
});
