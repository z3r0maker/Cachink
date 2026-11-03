import { handleCron } from '@/server/cron';
import { runRenewalEmails } from '@/server/email/renewal-emails';
import { portalUrl } from '@/server/email/sender';
import { reportError } from '@/server/observability/report';

/**
 * The daily renewal reminders (LFPC 76 Bis, ADR-132): Vercel Cron at 16:00
 * UTC (10:00 in Mexico City). The secret check is the shared `handleCron`.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const origin = portalUrl(new URL(request.url).origin);
  return handleCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    run: (now) => runRenewalEmails(origin, now),
    report: (error) => reportError(error, { endpoint: 'cron/renewal-emails' }),
    failure: 'renewal_emails_failed',
  });
}
