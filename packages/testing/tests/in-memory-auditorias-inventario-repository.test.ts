import { InMemoryAuditoriasInventarioRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeAuditoriasInventarioRepositoryContract } from '../src/contract/index.js';

describeAuditoriasInventarioRepositoryContract('InMemoryAuditoriasInventarioRepository', () => {
  return new InMemoryAuditoriasInventarioRepository(TEST_DEVICE_ID);
});
