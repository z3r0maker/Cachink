import 'server-only';

import {
  SendRenewalRemindersUseCase,
  type EmailRecipient,
  type RenewalReminder,
  type RenewalRemindersOutcome,
} from '@xangarro/application/email';
import { renderRenewalEmail } from '@xangarro/email';

import { billingDb, stripeClient } from '../billing/config';
import { pgRenewalNoticeStore, pgRenewingSource } from '../billing/cancel-repository';
import { reportError } from '../observability/report';
import { stripeRecipients } from './recipients';
import { portalEmailSender } from './sender';

/**
 * The daily renewal reminders (LFPC 76 Bis, ADR-132), over the billing
 * connection, the Stripe customer's address and the portal's sender. Run by
 * `GET /api/cron/renewal-emails` (Vercel Cron, `vercel.json`).
 */
export function composeRenewalEmail(origin: string) {
  return (r: RenewalReminder, to: EmailRecipient, token: string) =>
    renderRenewalEmail({
      kind: r.kind,
      plan: r.planId,
      interval: r.interval,
      negocio: to.name,
      chargeAt: r.chargeAt,
      totalCentavos: r.totalCentavos,
      cancelUrl: `${origin}/cancelar?t=${encodeURIComponent(token)}`,
    });
}

export function runRenewalEmails(origin: string, now: Date): Promise<RenewalRemindersOutcome> {
  const db = billingDb();
  const useCase = new SendRenewalRemindersUseCase({
    source: pgRenewingSource(db),
    notices: pgRenewalNoticeStore(db),
    recipients: stripeRecipients(stripeClient()),
    compose: composeRenewalEmail(origin),
    sender: portalEmailSender(),
    report: (error, businessId) =>
      reportError(error, { endpoint: 'cron/renewal-emails', businessId }),
  });
  return useCase.execute(now);
}
