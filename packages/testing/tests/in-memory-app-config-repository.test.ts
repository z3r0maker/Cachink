import { InMemoryAppConfigRepository } from '../src/index.js';
import { describeAppConfigRepositoryContract } from '../src/contract/index.js';

describeAppConfigRepositoryContract('InMemoryAppConfigRepository', () => {
  return new InMemoryAppConfigRepository();
});
