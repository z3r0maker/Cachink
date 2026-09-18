import { liveCloseCfdiPeriod } from '@/server/billing/cfdi';
import { handleCron } from '@/server/cron';
import { reportError } from '@/server/observability/report';

/**
 * The monthly global-CFDI close (N-33): Vercel Cron at 07:00 UTC on the 1st,
 * 01:00 in Mexico City, closing the month that just ended (`vercel.json`).
 * With `CFDI_MODE=off` it stamps nothing and lists the period's payments
 * still owed a CFDI in one admin inbox item.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  return handleCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    run: (now) => liveCloseCfdiPeriod(() => now).execute({}),
    report: (error) => reportError(error, { endpoint: 'cron/cfdi-close' }),
    failure: 'cfdi_close_failed',
  });
}
