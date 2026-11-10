import { secretMatches } from '../ingest/secret';

/**
 * What «Empresa»'s crons share (E-04, E-10): an uncached JSON answer, and
 * Vercel's `Authorization: Bearer $CRON_SECRET` check, 503 while no secret is
 * configured and 401 for anything else.
 */
export const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

function bearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

/** The refusal to answer, or null when the request carries the secret. */
export function rechazo(req: Request, secret: string | undefined): Response | null {
  if (!secret) return reply(503, { error: 'cron_disabled' });
  return secretMatches(bearer(req), secret) ? null : reply(401, { error: 'unauthorized' });
}
