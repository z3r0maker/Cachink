/**
 * RecordQuota — the plan's monthly transactions, as advice (C-12 step 4).
 *
 * Limits are advisory on every tier: the server accepts every row, and since
 * N-04 the capture path never blocks either. `assertCanCreate()` stays on the
 * interface (the use cases call it) but only resolves; `warning()` is what
 * the UI surfaces — a nudge to upgrade, never a refusal.
 */

import type { BusinessId, PlanId } from '@xangarro/domain';
import type { RecordUsageRepository } from '@xangarro/data';

export interface RecordQuota {
  assertCanCreate(): Promise<void>;
  /** The over-limit nudge, when this month has reached the plan's transactions. */
  warning(): Promise<QuotaWarning | null>;
}

export interface QuotaWarning {
  readonly plan: PlanId;
  readonly limit: number;
  readonly used: number;
}

export const UNLIMITED_QUOTA: RecordQuota = {
  assertCanCreate: async () => undefined,
  warning: async () => null,
};

export interface PlanRecordQuotaInput {
  readonly usage: RecordUsageRepository;
  readonly businessId: BusinessId;
  readonly plan: PlanId;
  /** Transactions the plan allows per month (C-12). */
  readonly transactionsPerMonth: number;
  /** `YYYY-MM` of the server-anchored now. */
  readonly yearMonth: string;
}

export class PlanRecordQuota implements RecordQuota {
  readonly #input: PlanRecordQuotaInput;

  constructor(input: PlanRecordQuotaInput) {
    this.#input = input;
  }

  async assertCanCreate(): Promise<void> {
    // Advisory (N-04): a capture is never refused over the transaction limit.
    await this.#usage();
  }

  async warning(): Promise<QuotaWarning | null> {
    const { plan, transactionsPerMonth } = this.#input;
    const used = await this.#usage();
    return used >= transactionsPerMonth ? { plan, limit: transactionsPerMonth, used } : null;
  }

  #usage(): Promise<number> {
    const { usage, businessId, yearMonth } = this.#input;
    return usage.countRecordsInMonth(businessId, yearMonth);
  }
}
