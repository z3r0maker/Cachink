/**
 * In-memory stand-ins for the onboarding ports (P-03, N-12 … N-15). The
 * Postgres versions live in the portal; these let the rules be tested alone.
 */

import type { PendingPaidAnswer, WizardAnswers } from '@xangarro/domain';

import type {
  NewOwner,
  OnboardingRecord,
  OnboardingStore,
  SignupStore,
  TrialCheckout,
  TrialCheckoutResult,
  TrialIntent,
} from '../../src/onboarding/index.js';

export class InMemoryOnboardingStore implements OnboardingStore {
  record: OnboardingRecord | null = null;
  writes = 0;

  find(): Promise<OnboardingRecord | null> {
    return Promise.resolve(this.record);
  }

  #upsert(patch: Partial<OnboardingRecord>): Promise<void> {
    this.writes += 1;
    this.record = {
      answers: {},
      pendingPaidAnswers: [],
      completedAt: null,
      trialIntent: null,
      ...this.record,
      ...patch,
    };
    return Promise.resolve();
  }

  saveAnswers(answers: WizardAnswers): Promise<void> {
    return this.#upsert({ answers });
  }

  complete(pending: readonly PendingPaidAnswer[], at: string): Promise<void> {
    return this.#upsert({ pendingPaidAnswers: pending, completedAt: at });
  }

  recordTrialIntent(intent: TrialIntent): Promise<void> {
    return this.#upsert({ trialIntent: intent });
  }
}

export class InMemorySignupStore implements SignupStore {
  readonly owners: NewOwner[] = [];

  constructor(private readonly taken: readonly string[] = []) {}

  emailTaken(email: string): Promise<boolean> {
    return Promise.resolve(
      this.taken.includes(email) || this.owners.some((o) => o.email === email),
    );
  }

  createOwner(owner: NewOwner): Promise<void> {
    this.owners.push(owner);
    return Promise.resolve();
  }
}

export class FakeTrialCheckout implements TrialCheckout {
  readonly calls: Parameters<TrialCheckout['startTrialCheckout']>[0][] = [];

  constructor(private readonly result: TrialCheckoutResult = { status: 'unavailable' }) {}

  startTrialCheckout(
    input: Parameters<TrialCheckout['startTrialCheckout']>[0],
  ): Promise<TrialCheckoutResult> {
    this.calls.push(input);
    return Promise.resolve(this.result);
  }
}
