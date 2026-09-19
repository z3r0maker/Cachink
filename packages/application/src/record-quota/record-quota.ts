/**
 * RecordQuota — the monthly record limit of the business's plan (A-10).
 *
 * Capture use cases (venta, egreso, movimiento) call `assertCanCreate()`
 * before writing; the UI builds the quota from the verified entitlement and
 * the server-anchored month. `UNLIMITED_QUOTA` is the default so tests and
 * paid plans pay nothing for the check.
 */

import { PlanLimitError, type BusinessId, type PlanId } from '@xangarro/domain';
import type { RecordUsageRepository } from '@xangarro/data';

export interface RecordQuota {
  assertCanCreate(): Promise<void>;
}

export const UNLIMITED_QUOTA: RecordQuota = { assertCanCreate: async () => undefined };

export interface PlanRecordQuotaInput {
  readonly usage: RecordUsageRepository;
  readonly businessId: BusinessId;
  readonly plan: PlanId;
  /** `null` = unlimited. */
  readonly recordsPerMonth: number | null;
  /** `YYYY-MM` of the server-anchored now. */
  readonly yearMonth: string;
}

export class PlanRecordQuota implements RecordQuota {
  readonly #input: PlanRecordQuotaInput;

  constructor(input: PlanRecordQuotaInput) {
    this.#input = input;
  }

  async assertCanCreate(): Promise<void> {
    const { usage, businessId, plan, recordsPerMonth, yearMonth } = this.#input;
    if (recordsPerMonth === null) return;
    const used = await usage.countRecordsInMonth(businessId, yearMonth);
    if (used >= recordsPerMonth) throw new PlanLimitError(plan, recordsPerMonth);
  }
}
