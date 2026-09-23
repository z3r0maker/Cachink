import 'server-only';

import {
  RecomputeUsageUseCase,
  RefreshUsageUseCase,
  type RecomputeUsageResult,
} from '@xangarro/application/usage';
import { createDb, usageCounterOf, type Db } from '@xangarro/data-pg';
import { usagePeriod } from '@xangarro/domain/usage';

import { billingDb } from '../billing/config';
import { reportError } from '../observability/report';
import { notifyUsageThreshold } from '../email/usage';
import { supportInboxFromEnv } from '../support-inbox';
import { pgUsageCounters, pgUsageCounts, pgUsageLimits, pgUsageNoticeLedger } from './adapters';
import { emailUsageNotifier, ownerEmailRecipients } from './owner-notifier';

/**
 * The usage composition root (N-02 / N-03).
 *
 * - `METERING_DATABASE_URL` — the `xangarro_metering` role: counts every
 *   tenant's counted columns, writes `usage_counters` / `usage_notices`, reads
 *   owner addresses through `xangarro.owner_email()`. Never the service role.
 * - Plans come from `subscriptions` on `BILLING_DATABASE_URL`.
 * - Owner emails go through B-14's sender (`RESEND_API_KEY`); provider items
 *   to the admin inbox (`ADMIN_INGEST_URL`, `ADMIN_INGEST_SECRET`).
 */
let metering: Db | undefined;

export function meteringDb(): Db {
  const url = process.env.METERING_DATABASE_URL;
  if (!url) throw new Error('METERING_DATABASE_URL is not set.');
  metering ??= createDb(url);
  return metering;
}

export function runUsageRecompute(now: Date): Promise<RecomputeUsageResult> {
  const db = meteringDb();
  const useCase = new RecomputeUsageUseCase({
    counts: pgUsageCounts(db),
    store: pgUsageCounters(db),
    limits: pgUsageLimits(billingDb(), () => now),
    ledger: pgUsageNoticeLedger(db),
    owner: emailUsageNotifier(notifyUsageThreshold, ownerEmailRecipients(db)),
    inbox: supportInboxFromEnv(),
    now: () => now,
  });
  return useCase.execute();
}

/**
 * After a push lands (N-02): recount this business's open month so its next
 * pull carries a count no older than the push. Runs after the response
 * (`after()` in the push route); a failure is reported and the nightly job
 * corrects it — a push is never failed over a counter. Skipped, silently,
 * where `METERING_DATABASE_URL` is not configured (local runs without it).
 */
export async function refreshUsageAfterPush(
  businessId: string,
  now: Date = new Date(),
): Promise<void> {
  if (!process.env.METERING_DATABASE_URL) return;
  try {
    const db = meteringDb();
    await new RefreshUsageUseCase({
      counts: pgUsageCounts(db),
      store: pgUsageCounters(db),
      now: () => now,
    }).execute(businessId);
  } catch (error) {
    reportError(error, { endpoint: 'sync/push:usage', businessId });
  }
}

/** C-12's unsigned `usage` block, as the pull / entitlement payload will carry it. */
export interface UsagePayload {
  readonly period: string;
  readonly transactions: number;
  readonly products: number;
  readonly computedAt: string;
}

/**
 * The business's usage for the open month, from the last recompute — ready
 * for `/sync/pull` and `/entitlement`. **Not wired into either response yet:**
 * C-12's `usage` field is not in `@xangarro/contracts` on main. When it lands,
 * the pull/entitlement handlers call this (null → omit the block).
 */
export async function usageFor(
  businessId: string,
  now: Date = new Date(),
): Promise<UsagePayload | null> {
  const row = await usageCounterOf(meteringDb(), businessId, usagePeriod(now));
  if (row === null) return null;
  return {
    period: row.period,
    transactions: row.transactions,
    products: row.activeProducts,
    computedAt: row.computedAt,
  };
}
