import { deps, invocarAsesor } from '@/server/asesor/invocacion';
import { fanOutAsesor, fanOutDeps } from '@/server/asesor/fanout';
import { handleCron } from '@/server/cron';
import { reportError } from '@/server/observability/report';

/**
 * The Asesor's daily generation (P-30, ADR-056), in two shapes that share one
 * guard (`CRON_SECRET`):
 *
 * - **`GET`** — the scheduled fan-out. Vercel Cron calls a fixed path with no
 *   body, which is why this is the GET and why `vercel.json` can finally carry
 *   an entry for it. It enumerates every live business on the metering
 *   connection and runs the unit of work per tenant (`server/asesor/fanout`).
 * - **`POST {"businessId": "…"}`** — one business, on demand. ADR-056's unit of
 *   work, kept as its own entry point so a single tenant can be regenerated
 *   without sweeping the estate.
 *
 * A tenant that fails is reported under its own id and listed in `fallidos`;
 * the sweep still answers 200, because a scheduled job that dies on the first
 * bad tenant hides every tenant behind it.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  return handleCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    run: (now) => fanOutAsesor(fanOutDeps(), now),
    report: (error) => reportError(error, { endpoint: 'cron/asesor' }),
    failure: 'asesor_fanout_failed',
  });
}

export async function POST(request: Request): Promise<Response> {
  return invocarAsesor(request, deps());
}
