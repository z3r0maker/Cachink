import { createHash, timingSafeEqual } from 'node:crypto';

import type { TrialRemindersOutcome } from '@xangarro/application/email';

/**
 * `GET /api/cron/trial-emails` — Vercel Cron calls it daily at 15:00 UTC
 * (09:00 in Mexico City). Vercel sends `Authorization: Bearer $CRON_SECRET`;
 * anything else is refused, and an unset secret closes the route rather than
 * opening it (the admin console's digest cron does the same).
 */
export interface TrialCronDeps {
  /** `CRON_SECRET`. */
  readonly secret: string | undefined;
  readonly now: () => Date;
  readonly run: (now: Date) => Promise<TrialRemindersOutcome>;
  readonly report: (error: unknown) => void;
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

export async function handleTrialEmailsCron(req: Request, deps: TrialCronDeps): Promise<Response> {
  if (!deps.secret) return reply(503, { error: 'cron_disabled' });
  if (!matches(bearer(req), deps.secret)) return reply(401, { error: 'unauthorized' });
  try {
    return reply(200, { ok: true, ...(await deps.run(deps.now())) });
  } catch (error) {
    deps.report(error);
    return reply(500, { error: 'trial_emails_failed' });
  }
}
