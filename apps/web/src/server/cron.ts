import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * The guard every portal Vercel Cron route shares (trial emails, usage
 * recompute, CFDI close). Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * anything else is refused, and an unset secret closes the route rather than
 * opening it (the admin console's digest cron does the same). A failed run is
 * reported and answered 500, so it shows in Vercel's cron log.
 */
export interface CronDeps<T extends object> {
  /** `CRON_SECRET`. */
  readonly secret: string | undefined;
  readonly now: () => Date;
  readonly run: (now: Date) => Promise<T>;
  readonly report: (error: unknown) => void;
  /** The error code a failed run answers with, e.g. `usage_failed`. */
  readonly failure: string;
}

const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

/** Constant-time over 32-byte digests, so the secret's length does not leak. */
function matches(given: string | null, expected: string): boolean {
  if (given === null) return false;
  const a = createHash('sha256').update(given, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b);
}

function bearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

/**
 * The guard on its own, for a scheduled route whose success is not always a
 * bare 200 — P-30's per-business invocation answers 400 when the caller names
 * no business, which it may only do *after* proving it is the caller.
 */
export function cronAuth(
  req: Request,
  secret: string | undefined,
): 'ok' | 'disabled' | 'unauthorized' {
  if (!secret) return 'disabled';
  return matches(bearer(req), secret) ? 'ok' : 'unauthorized';
}

/** The refusal `cronAuth` earned, as the response every cron route shares. */
export function cronRefusal(estado: 'disabled' | 'unauthorized'): Response {
  return estado === 'disabled'
    ? reply(503, { error: 'cron_disabled' })
    : reply(401, { error: 'unauthorized' });
}

export const cronReply = reply;

export async function handleCron<T extends object>(
  req: Request,
  deps: CronDeps<T>,
): Promise<Response> {
  const estado = cronAuth(req, deps.secret);
  if (estado !== 'ok') return cronRefusal(estado);
  try {
    return reply(200, { ok: true, ...(await deps.run(deps.now())) });
  } catch (error) {
    deps.report(error);
    return reply(500, { error: deps.failure });
  }
}
