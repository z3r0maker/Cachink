/**
 * CancelacionLogsRepository — immutable audit trail for sale cancellations.
 *
 * Records are never updated or deleted. Part of the Cancelaciones feature.
 */

import type { CancelacionLog, NewCancelacionLog } from '@cachink/domain';
import type { CancelacionLogId, BusinessId, SaleId } from '@cachink/domain';

export type { CancelacionLog, NewCancelacionLog };

export interface CancelacionLogsRepository {
  /** Create an immutable cancellation log entry. */
  create(input: NewCancelacionLog): Promise<CancelacionLog>;

  /** Find a log entry by ID. */
  findById(id: CancelacionLogId): Promise<CancelacionLog | null>;

  /** Find log entry by sale ID. */
  findBySaleId(saleId: SaleId): Promise<CancelacionLog | null>;

  /** List all cancellation logs for a business in a date range. */
  findByDateRange(
    from: string,
    to: string,
    businessId: BusinessId,
  ): Promise<readonly CancelacionLog[]>;
}
