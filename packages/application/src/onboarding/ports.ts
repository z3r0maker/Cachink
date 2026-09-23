/**
 * What the onboarding use cases need from storage and billing (P-03, N-12 …
 * N-15). The Postgres versions live in the portal; the tests use in-memory
 * ones, so both see exactly the same rules.
 *
 * A store is built for one caller — one business, one open transaction — so
 * none of these take a tenant (as `PushStore`).
 */

import type {
  BusinessId,
  ConsentGrant,
  PendingPaidAnswer,
  PlanId,
  WizardAnswers,
} from '@xangarro/domain';

export const BILLING_INTERVALS = ['mensual', 'anual'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/** A [Probar 14 días] tap, kept until Checkout exists (B-10). */
export interface TrialIntent {
  readonly plan: PlanId;
  readonly interval: BillingInterval;
  /** ISO-8601. */
  readonly at: string;
}

export interface OnboardingRecord {
  /** Raw JSON: every use case re-validates it with `WizardAnswersSchema`. */
  readonly answers: unknown;
  readonly pendingPaidAnswers: readonly PendingPaidAnswer[];
  readonly completedAt: string | null;
  readonly trialIntent: TrialIntent | null;
}

export interface OnboardingStore {
  find(): Promise<OnboardingRecord | null>;
  saveAnswers(answers: WizardAnswers): Promise<void>;
  /** Marks the wizard applied and replaces the pending paid answers. */
  complete(pending: readonly PendingPaidAnswer[], at: string): Promise<void>;
  recordTrialIntent(intent: TrialIntent): Promise<void>;
}

/** Everything signup creates, written in one transaction by the store. */
export interface NewOwner {
  /** `auth.users.id` — a UUID, not a ULID (a different id space, ADR-062). */
  readonly userId: string;
  readonly email: string;
  readonly passwordHash: string;
  /** The account's display name (O-24); null when the person skipped it. */
  readonly nombre: string | null;
  readonly businessId: BusinessId;
  /** `business_members.id`. */
  readonly memberId: string;
  readonly nombreNegocio: string;
  readonly regimenFiscal: string;
  /** Basis points. */
  readonly isrTasa: number;
  /** ISO-8601. */
  readonly at: string;
  /**
   * The consent rows for this signup (N-34): written in the same transaction
   * as the account, so an account without proof of consent cannot exist.
   */
  readonly consentimientos: readonly ConsentGrant[];
}

export interface SignupStore {
  emailTaken(email: string): Promise<boolean>;
  /** User + business + owner membership, all or nothing. */
  createOwner(owner: NewOwner): Promise<void>;
}

export type TrialCheckoutResult =
  | { readonly status: 'redirect'; readonly url: string }
  | { readonly status: 'unavailable' };

/**
 * The seam B-10 fills: a Stripe Checkout session with a 14-day trial and no
 * card up front (ADR-067). Until then the portal's implementation answers
 * `unavailable`.
 */
export interface TrialCheckout {
  startTrialCheckout(input: {
    readonly businessId: BusinessId;
    readonly plan: PlanId;
    readonly interval: BillingInterval;
  }): Promise<TrialCheckoutResult>;
}
