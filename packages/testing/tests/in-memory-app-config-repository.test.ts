import {
  InMemoryAppConfigRepository,
  describeAppConfigRepositoryContract,
} from '../src/index.js';

describeAppConfigRepositoryContract('InMemoryAppConfigRepository', () => {
  return new InMemoryAppConfigRepository();
});
