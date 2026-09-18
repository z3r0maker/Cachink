import { handleTrialEmailsCron } from '@/server/email/cron';
import { portalUrl } from '@/server/email/sender';
import { runTrialEmails } from '@/server/email/trial-emails';
import { reportError } from '@/server/observability/report';

/** The daily trial emails (N-01, B-14); see `src/server/email/cron.ts`. */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const origin = portalUrl(new URL(request.url).origin);
  return handleTrialEmailsCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    run: (now) => runTrialEmails(origin, now),
    report: (error) => reportError(error, { endpoint: 'cron/trial-emails' }),
  });
}
