/**
 * `GET /api/cron/digest` — Vercel Cron calls it daily at 14:00 UTC (08:00 in
 * Mexico City, `vercel.json`). Vercel sends `Authorization: Bearer
 * $CRON_SECRET`; anything else is refused, and an unset secret closes the
 * route rather than opening it.
 */
import type { SupportItem } from '@xangarro/domain';

import { store } from '../inbox/errors';
import type { SupportItemRepository } from '../inbox/port';
import { secretMatches } from '../ingest/secret';
import { buildDailyDigest } from './digest';
import { digestWindow } from './mx-day';
import type { Mailer } from './email';

export interface DigestCronDeps {
  /** `CRON_SECRET`. */
  readonly secret: string | undefined;
  readonly now: () => Date;
  readonly repo: SupportItemRepository;
  readonly mailer: Mailer;
  readonly to: string;
  readonly consoleUrl?: string;
  readonly log?: (message: string, error: unknown) => void;
}

const reply = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } });

function bearer(req: Request): string | null {
  const header = req.headers.get('authorization') ?? '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
}

export async function handleDigestCron(req: Request, deps: DigestCronDeps): Promise<Response> {
  if (!deps.secret) return reply(503, { error: 'cron_disabled' });
  if (!secretMatches(bearer(req), deps.secret)) return reply(401, { error: 'unauthorized' });
  const log = deps.log ?? console.error;
  const now = deps.now();

  let items: SupportItem[];
  try {
    items = await store(() => deps.repo.listForDigest(digestWindow(now).start.toISOString()));
  } catch (error) {
    log('digest: reading the inbox failed', error);
    return reply(500, { error: 'store_failed' });
  }

  const digest = buildDailyDigest(items, now, { consoleUrl: deps.consoleUrl });
  try {
    await deps.mailer.send({
      to: deps.to,
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
    });
  } catch (error) {
    log('digest: sending failed', error);
    return reply(502, { error: 'mail_failed' });
  }
  return reply(200, { ok: true, subject: digest.subject, counts: digest.counts });
}
