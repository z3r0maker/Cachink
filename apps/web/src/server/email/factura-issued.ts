import 'server-only';

import type { IssuedCfdiListener } from '@xangarro/application/cfdi';
import type { EmailSender, OwnerRecipients } from '@xangarro/application/email';
import { renderFacturaIssuedEmail } from '@xangarro/email';

import { billingDb, stripeClient } from '../billing/config';
import { pgBillingRepository } from '../billing/repository';
import { DEFAULT_PORTAL_ORIGIN } from './payment-failed';
import { ownersViaBilling, stripeRecipients } from './recipients';
import { portalEmailSender, portalUrl, sendReported } from './sender';

/**
 * The `IssuedCfdiListener` the CFDI flow is built with (B-14, N-33): when a
 * CFDI is stamped for a payment, the factura's own contact — the receptor's
 * email from the business's fiscal data (P-10) — is told, falling back to
 * the Stripe customer. Keyed by the payment, so a re-run stamps nothing new
 * and sends nothing new. Only reachable while `CFDI_MODE` is `test`/`live`.
 */
export interface FacturaIssuedEmailDeps {
  readonly owners: OwnerRecipients;
  readonly sender?: EmailSender;
  readonly origin?: string;
}

export function facturaIssuedEmailListener(deps: FacturaIssuedEmailDeps): IssuedCfdiListener {
  return {
    async onIssued(record) {
      const uuid = record.invoice?.uuid;
      if (uuid === undefined) return;
      const owner = await deps.owners.of(record.tenantId);
      const to = record.receptor?.email ?? owner?.email;
      if (to === undefined) return;
      const content = await renderFacturaIssuedEmail({
        name: owner?.name ?? null,
        uuid,
        totalCentavos: Number(record.totalCentavos),
        paidAt: record.paidAt.toISOString(),
        facturasUrl: `${portalUrl(deps.origin ?? DEFAULT_PORTAL_ORIGIN)}/suscripcion`,
      });
      await sendReported(
        deps.sender ?? portalEmailSender(),
        {
          ...content,
          to,
          tags: [{ name: 'kind', value: 'factura-issued' }],
          idempotencyKey: `factura-issued:${record.externalPaymentId}`,
        },
        { endpoint: 'stripe/webhook', businessId: record.tenantId },
      );
    },
  };
}

/** Real Stripe, the billing connection, the portal's sender. */
export function liveFacturaIssuedListener(): IssuedCfdiListener {
  const repo = pgBillingRepository(billingDb());
  return facturaIssuedEmailListener({
    owners: ownersViaBilling((id) => repo.customerOf(id), stripeRecipients(stripeClient())),
  });
}
