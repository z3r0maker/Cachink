/**
 * Cancel and resume (LFPC art. 76 Bis, ADR-132).
 *
 * «Cancelar suscripción» is one tap with no «¿seguro?»: the subscription ends
 * at the end of the period already paid, nothing is refunded and nothing more
 * is charged. Every cancellation gets a folio (the acuse) and a confirmation
 * email. «Seguir con mi plan» undoes it until that date.
 *
 * Stripe is the truth: the row is rewritten from what Stripe answered, so the
 * screen shows the change before the webhook arrives (which rewrites the same
 * row again).
 */

import { BillingError } from './errors.js';
import type {
  CancellationChannel,
  CancellationLedger,
  CancellationListener,
} from './cancel-ports.js';
import type { BillingGateway, BillingRepository, SubscriptionRecord } from './ports.js';
import { recordFrom } from './record.js';
import { currentSubscription, isLive } from './status.js';

export type CancelResult =
  | { readonly outcome: 'cancelled'; readonly endsAt: string; readonly folio: string }
  | { readonly outcome: 'already'; readonly endsAt: string };

export interface CancelSubscriptionInput {
  readonly businessId: string;
  readonly channel: CancellationChannel;
  readonly requestedBy: string | null;
}

export interface CancelSubscriptionDeps {
  readonly repo: BillingRepository;
  readonly gateway: BillingGateway;
  readonly ledger: CancellationLedger;
  readonly notices: CancellationListener;
  /** A confirmation that could not be sent never undoes the cancellation. */
  readonly report: (error: unknown, businessId: string) => void;
  readonly now: () => Date;
}

async function liveSubscription(
  repo: BillingRepository,
  businessId: string,
): Promise<SubscriptionRecord> {
  const current = currentSubscription(await repo.subscriptionsOf(businessId));
  if (current === null || !isLive(current)) throw new BillingError('NO_SUBSCRIPTION');
  return current;
}

async function rewrite(
  repo: BillingRepository,
  gateway: BillingGateway,
  current: SubscriptionRecord,
  cancel: boolean,
) {
  const facts = await gateway.setCancelAtPeriodEnd(current.stripeSubscriptionId, cancel);
  const record = recordFrom(facts, current.businessId, 'sync');
  if (record !== null) await repo.saveSubscription(record);
  return facts;
}

export class CancelSubscriptionUseCase {
  readonly #deps: CancelSubscriptionDeps;
  constructor(deps: CancelSubscriptionDeps) {
    this.#deps = deps;
  }

  async execute(input: CancelSubscriptionInput): Promise<CancelResult> {
    const { repo, gateway, ledger, now } = this.#deps;
    const current = await liveSubscription(repo, input.businessId);
    if (current.cancelAt !== null) return { outcome: 'already', endsAt: current.cancelAt };

    const facts = await rewrite(repo, gateway, current, true);
    const requestedAt = now().toISOString();
    const act = {
      businessId: input.businessId,
      stripeSubscriptionId: current.stripeSubscriptionId,
      channel: input.channel,
      endsAt: facts.cancelAt ?? facts.currentPeriodEnd ?? current.currentPeriodEnd ?? requestedAt,
      requestedBy: input.requestedBy,
      requestedAt,
    };
    const folio = await ledger.record(act);
    await this.#confirm({ ...act, folio, planId: current.planId, interval: current.interval });
    return { outcome: 'cancelled', endsAt: act.endsAt, folio };
  }

  async #confirm(notice: Parameters<CancellationListener['onCancelled']>[0]): Promise<void> {
    try {
      await this.#deps.notices.onCancelled(notice);
    } catch (error) {
      this.#deps.report(error, notice.businessId);
    }
  }
}

export type ResumeResult = { readonly outcome: 'resumed' | 'already' };

export class ResumeSubscriptionUseCase {
  readonly #repo: BillingRepository;
  readonly #gateway: BillingGateway;
  constructor(repo: BillingRepository, gateway: BillingGateway) {
    this.#repo = repo;
    this.#gateway = gateway;
  }

  async execute(input: { readonly businessId: string }): Promise<ResumeResult> {
    const current = await liveSubscription(this.#repo, input.businessId);
    if (current.cancelAt === null) return { outcome: 'already' };
    await rewrite(this.#repo, this.#gateway, current, false);
    return { outcome: 'resumed' };
  }
}
