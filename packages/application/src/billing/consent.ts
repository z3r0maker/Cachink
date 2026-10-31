/**
 * Proof the owner agreed to the recurring charge (LFPC art. 76 Bis II).
 *
 * The agreement happens inside Stripe Checkout: a required «Acepto…» box
 * (`consent_collection.terms_of_service`) whose text states the amount with
 * IVA, how often it is charged and how to cancel. Stripe records the tick on
 * the Checkout Session; the webhook copies it here so the proof does not live
 * only at Stripe. The adapter stamps which version of the Términos it was.
 */
export interface TermsAcceptance {
  readonly checkoutSessionId: string;
  readonly businessId: string;
  readonly stripeSubscriptionId: string | null;
  readonly acceptedAt: string;
}

export interface ConsentLedger {
  /** Idempotent per Checkout Session: a redelivered event records nothing new. */
  recordTerms(acceptance: TermsAcceptance): Promise<void>;
}
