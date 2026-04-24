import {
  InMemoryInventoryMovementsRepository,
  TEST_DEVICE_ID,
  describeInventoryMovementsRepositoryContract,
} from '../src/index.js';

describeInventoryMovementsRepositoryContract('InMemoryInventoryMovementsRepository', () => {
  return new InMemoryInventoryMovementsRepository(TEST_DEVICE_ID);
});
