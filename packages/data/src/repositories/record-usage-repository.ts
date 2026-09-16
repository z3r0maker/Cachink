/**
 * RecordUsageRepository — how many captures count against the plan's
 * monthly record limit (A-10, Q14).
 *
 * One capture = one record: every sale, every expense (an inventory entrada
 * counts through the expense it creates), and every manual stock salida.
 * The salida a sale creates automatically is not counted twice. Rows are
 * counted by business date (`fecha`) including soft-deleted ones, so deleting
 * and re-entering does not free up records.
 */

import type { BusinessId } from '@xangarro/domain';

export interface RecordUsageRepository {
  /** Records whose `fecha` falls in `yearMonth` (`YYYY-MM`). */
  countRecordsInMonth(businessId: BusinessId, yearMonth: string): Promise<number>;
}
