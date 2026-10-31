/**
 * The one-click cancel link of a renewal reminder (LFPC art. 76 Bis).
 *
 * Opening the link spends nothing: mail scanners open links on their own. The
 * page `peek`s and shows one button; only `confirm` cancels, through the same
 * use case as Plan y pagos, and spends the link. A link works until the charge
 * it announced, and only for the subscription it was sent for.
 */

import type { CancelSubscriptionUseCase } from './cancel-subscription.js';
import type { RenewalNotice, RenewalNoticeStore } from './cancel-ports.js';
import { totalCentavos, type BillingInterval, type PaidPlanId } from './plans.js';
import type { BillingRepository } from './ports.js';
import { currentSubscription, isLive } from './status.js';

export type CancelLinkView =
  | {
      readonly state: 'confirmar';
      readonly negocio: string | null;
      readonly planId: PaidPlanId;
      readonly interval: BillingInterval;
      /** The plan runs until here; the charge announced for it is not made. */
      readonly endsAt: string;
      /** The charge that will not happen, IVA included, in centavos. */
      readonly totalCentavos: number;
    }
  | { readonly state: 'listo' | 'ya'; readonly endsAt: string }
  | { readonly state: 'vencido' };

export interface CancelLinkDeps {
  readonly store: RenewalNoticeStore;
  readonly repo: BillingRepository;
  readonly cancel: Pick<CancelSubscriptionUseCase, 'execute'>;
  /** The Stripe customer's name, for the card's eyebrow; `null` when unknown. */
  readonly customerName: (stripeCustomerId: string) => Promise<string | null>;
  readonly now: () => Date;
}

const VENCIDO = { state: 'vencido' } as const;

export class CancelLinkUseCase {
  readonly #deps: CancelLinkDeps;
  constructor(deps: CancelLinkDeps) {
    this.#deps = deps;
  }

  async peek(token: string): Promise<CancelLinkView> {
    const notice = token === '' ? null : await this.#deps.store.find(token);
    return notice === null ? VENCIDO : this.#view(notice);
  }

  async confirm(token: string): Promise<CancelLinkView> {
    const notice = token === '' ? null : await this.#deps.store.find(token);
    if (notice === null) return VENCIDO;
    const view = await this.#view(notice);
    if (view.state !== 'confirmar') return view;
    const r = await this.#deps.cancel.execute({
      businessId: notice.businessId,
      channel: 'correo',
      requestedBy: null,
    });
    await this.#deps.store.markUsed(token);
    return { state: r.outcome === 'cancelled' ? 'listo' : 'ya', endsAt: r.endsAt };
  }

  async #view(notice: RenewalNotice): Promise<CancelLinkView> {
    const { repo, now, customerName } = this.#deps;
    if (now().getTime() >= Date.parse(notice.periodEnd)) return VENCIDO;
    const current = currentSubscription(await repo.subscriptionsOf(notice.businessId));
    if (current === null || !isLive(current)) return VENCIDO;
    if (current.stripeSubscriptionId !== notice.stripeSubscriptionId) return VENCIDO;
    if (current.cancelAt !== null) return { state: 'ya', endsAt: current.cancelAt };
    if (notice.usedAt !== null) return VENCIDO;
    return {
      state: 'confirmar',
      negocio: await customerName(current.stripeCustomerId).catch(() => null),
      planId: current.planId,
      interval: current.interval,
      endsAt: current.currentPeriodEnd ?? notice.periodEnd,
      totalCentavos: totalCentavos(current.planId, current.interval),
    };
  }
}
