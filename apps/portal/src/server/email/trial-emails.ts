import 'server-only';

import {
  SendTrialRemindersUseCase,
  type TrialReminder,
  type EmailRecipient,
  type TrialRemindersOutcome,
} from '@xangarro/application/email';
import { renderTrialEmail } from '@xangarro/email';

import { billingDb, stripeClient } from '../billing/config';
import { reportError } from '../observability/report';
import { stripeRecipients } from './recipients';
import { portalEmailSender } from './sender';
import { pgTrialSource } from './trial-source';

/**
 * The daily trial emails (N-01 day 11 / day 14), composed over the billing
 * connection, the Stripe customer's address and the portal's sender. Run by
 * `GET /api/cron/trial-emails` (Vercel Cron, `vercel.json`).
 */
export function composeTrialEmail(origin: string) {
  return (reminder: TrialReminder, to: EmailRecipient) =>
    renderTrialEmail({
      stage: reminder.kind === 'trial-ending' ? 'ending' : 'ended',
      plan: reminder.planId,
      trialEnd: reminder.trialEnd,
      subscriptionUrl: `${origin}/suscripcion`,
      name: to.name,
    });
}

export function runTrialEmails(origin: string, now: Date): Promise<TrialRemindersOutcome> {
  const useCase = new SendTrialRemindersUseCase({
    trials: pgTrialSource(billingDb()),
    recipients: stripeRecipients(stripeClient()),
    compose: composeTrialEmail(origin),
    sender: portalEmailSender(),
    report: (error, businessId) =>
      reportError(error, { endpoint: 'cron/trial-emails', businessId }),
  });
  return useCase.execute(now);
}
