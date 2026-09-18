import { handleCron } from '@/server/cron';
import { reportError } from '@/server/observability/report';
import { runUsageRecompute } from '@/server/usage/live';

/**
 * The nightly usage recompute (N-02) and its limit notices (N-03): Vercel
 * Cron at 09:00 UTC, 03:00 in Mexico City (`vercel.json`). A business whose
 * notices failed is reported and retried on the next run.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  return handleCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    run: async (now) => {
      const result = await runUsageRecompute(now);
      for (const f of result.failures) {
        reportError(new Error(f.error), { endpoint: 'cron/usage', businessId: f.businessId });
      }
      return result;
    },
    report: (error) => reportError(error, { endpoint: 'cron/usage' }),
    failure: 'usage_failed',
  });
}
