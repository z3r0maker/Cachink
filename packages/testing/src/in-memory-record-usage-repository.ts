/**
 * In-memory {@link RecordUsageRepository}: tests set the count directly.
 */

import type { BusinessId } from '@xangarro/domain';
import type { RecordUsageRepository } from '@xangarro/data';

export class InMemoryRecordUsageRepository implements RecordUsageRepository {
  #count = 0;

  /** Test helper: records already used this month. */
  setCount(n: number): void {
    this.#count = n;
  }

  async countRecordsInMonth(_businessId: BusinessId, _yearMonth: string): Promise<number> {
    return this.#count;
  }
}
