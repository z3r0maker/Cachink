import { InMemoryEntregasCreditoRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeEntregasCreditoRepositoryContract } from '../src/contract/index.js';

describeEntregasCreditoRepositoryContract('InMemoryEntregasCreditoRepository', () => {
  return new InMemoryEntregasCreditoRepository(TEST_DEVICE_ID);
});
