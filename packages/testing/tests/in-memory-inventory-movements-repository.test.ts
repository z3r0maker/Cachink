import { InMemoryInventoryMovementsRepository, TEST_DEVICE_ID } from '../src/index.js';
import { describeInventoryMovementsRepositoryContract } from '../src/contract/index.js';

describeInventoryMovementsRepositoryContract('InMemoryInventoryMovementsRepository', () => {
  return new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
});
