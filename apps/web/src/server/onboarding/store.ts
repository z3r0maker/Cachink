import 'server-only';

import type { OnboardingRecord, OnboardingStore, TrialIntent } from '@xangarro/application';
import { businessOnboarding } from '@xangarro/data-pg';
import type { PendingPaidAnswer, WizardAnswers } from '@xangarro/domain';

import type { Tx } from '../db';

/**
 * `OnboardingStore` over `business_onboarding`, inside one tenant transaction.
 *
 * Portal-only (ADR-060): no `sync_log` append — no device has this table.
 * RLS scopes every statement, so the business id is only ever used as the
 * primary key of the row being upserted, never as a filter (ADR-062).
 */
export function pgOnboardingStore(tx: Tx, businessId: string): OnboardingStore {
  const upsert = async (set: Partial<typeof businessOnboarding.$inferInsert>) => {
    const updatedAt = new Date().toISOString();
    await tx
      .insert(businessOnboarding)
      .values({ businessId, updatedAt, ...set })
      .onConflictDoUpdate({ target: businessOnboarding.businessId, set: { ...set, updatedAt } });
  };
  return {
    async find(): Promise<OnboardingRecord | null> {
      const [row] = await tx.select().from(businessOnboarding);
      if (!row) return null;
      return {
        answers: row.answers,
        pendingPaidAnswers: row.pendingPaidAnswers as PendingPaidAnswer[],
        completedAt: row.completedAt,
        trialIntent: row.trialIntent as TrialIntent | null,
      };
    },
    saveAnswers: (answers: WizardAnswers) => upsert({ answers }),
    complete: (pending: readonly PendingPaidAnswer[], at: string) =>
      upsert({ pendingPaidAnswers: pending, completedAt: at }),
    recordTrialIntent: (intent: TrialIntent) => upsert({ trialIntent: intent }),
  };
}
