import type { BillingBusiness, StartTrialCheckoutUseCase } from '@xangarro/application/billing';

/**
 * The adapter for N-13's `TrialCheckout` port (branch
 * `track-n/n13-signup-wizard`, `server/onboarding/checkout.ts`), declared
 * structurally because that port is not on main yet. At merge, the stub there
 * becomes:
 *
 *   trialCheckoutWith(liveBillingUseCases().trial, owner, urls)
 *
 * The wizard speaks `mensual | anual`; billing speaks Stripe's `month | year`.
 * A refusal (already subscribed, no email) or an unconfigured Stripe answers
 * `unavailable`, which the wizard already renders.
 */
export type WizardInterval = 'mensual' | 'anual';
export type TrialSeamResult =
  | { readonly status: 'redirect'; readonly url: string }
  | { readonly status: 'unavailable' };

const INTERVAL: Readonly<Record<WizardInterval, 'month' | 'year'>> = {
  mensual: 'month',
  anual: 'year',
};

export function trialCheckoutWith(
  useCase: Pick<StartTrialCheckoutUseCase, 'execute'>,
  business: BillingBusiness,
  urls: { readonly successUrl: string; readonly cancelUrl: string },
  report: (error: unknown) => void,
) {
  return {
    async startTrialCheckout(input: {
      readonly plan: string;
      readonly interval: WizardInterval;
    }): Promise<TrialSeamResult> {
      try {
        const url = await useCase.execute({
          business,
          plan: input.plan,
          interval: INTERVAL[input.interval],
          ...urls,
        });
        return { status: 'redirect', url };
      } catch (error) {
        report(error);
        return { status: 'unavailable' };
      }
    },
  };
}
