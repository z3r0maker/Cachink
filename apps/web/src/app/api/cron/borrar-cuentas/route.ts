import { handleCron } from '@/server/cron';
import { liveBorrarCuentas } from '@/server/cuenta/live';
import { portalUrl } from '@/server/email/sender';
import { reportError } from '@/server/observability/report';

/**
 * Account deletion's daily job (ADR-136): the reminder three days before, the
 * erase on the day. Vercel Cron at 10:00 UTC (04:00 in Mexico City), guarded by
 * the shared `handleCron`.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const origin = portalUrl(new URL(request.url).origin);
  return handleCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    run: (now) => liveBorrarCuentas(origin).execute(now),
    report: (error) => reportError(error, { endpoint: 'cron/borrar-cuentas' }),
    failure: 'borrar_cuentas_failed',
  });
}
