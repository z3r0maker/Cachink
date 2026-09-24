import { deps, invocarAsesor } from '@/server/asesor/invocacion';

/**
 * `POST /api/cron/asesor` — one business's Asesor generation (P-30, ADR-056).
 *
 * POST, not GET, and not a `vercel.json` cron entry: Vercel Cron calls a fixed
 * path with no body, and ADR-056 requires one business per invocation. So this
 * is the *unit of work* an enqueuer calls, once per due business, with the
 * same `CRON_SECRET` the scheduled routes share. The daily selector that fans
 * out to it is not built yet — it needs a cross-tenant read of which
 * businesses are live, which no role in the portal has today.
 *
 * Until then this route is reachable by anything holding `CRON_SECRET`, which
 * is how a single business is regenerated on demand.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  return invocarAsesor(request, deps());
}
