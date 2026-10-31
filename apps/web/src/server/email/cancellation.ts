import 'server-only';

import type { CancellationListener } from '@xangarro/application/billing';
import type { CustomerRecipients, EmailSender } from '@xangarro/application/email';
import { renderCancellationEmail } from '@xangarro/email';

import { DEFAULT_PORTAL_ORIGIN } from './payment-failed';
import { portalUrl, sendReported } from './sender';

/**
 * The cancellation acuse (LFPC 76 Bis, ADR-132): one email per cancellation,
 * to the Stripe customer's address, with the folio. The key is the folio, so a
 * retried send never doubles it.
 */
export interface CancellationEmailDeps {
  readonly customerOf: (businessId: string) => Promise<string | null>;
  readonly customers: CustomerRecipients;
  readonly sender: EmailSender;
  readonly origin?: string;
}

export function cancellationEmailListener(deps: CancellationEmailDeps): CancellationListener {
  return {
    async onCancelled(notice) {
      const customerId = await deps.customerOf(notice.businessId);
      const to = customerId === null ? null : await deps.customers.of(customerId);
      if (to === null) return;
      const content = await renderCancellationEmail({
        plan: notice.planId,
        interval: notice.interval,
        negocio: to.name,
        endsAt: notice.endsAt,
        requestedAt: notice.requestedAt,
        folio: notice.folio,
        subscriptionUrl: `${portalUrl(deps.origin ?? DEFAULT_PORTAL_ORIGIN)}/suscripcion`,
      });
      await sendReported(
        deps.sender,
        {
          ...content,
          to: to.email,
          tags: [{ name: 'kind', value: 'cancellation' }],
          idempotencyKey: `cancellation:${notice.folio}`,
        },
        { endpoint: 'billing/cancel', businessId: notice.businessId },
      );
    },
  };
}
