import { handleCron } from '@/server/cron';
import { reportError } from '@/server/observability/report';
import { runPurgarFotos } from '@/server/productos/purgar-fotos';

/**
 * The purge of superseded product photos (ADR-134, B-19): Vercel Cron at
 * 11:00 UTC, 05:00 in Mexico City (`vercel.json`), guarded by the shared
 * `handleCron`. A missed night costs nothing; the next run takes it all.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  return handleCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    run: () => runPurgarFotos(),
    report: (error) => reportError(error, { endpoint: 'cron/purgar-fotos' }),
    failure: 'purgar_fotos_failed',
  });
}
