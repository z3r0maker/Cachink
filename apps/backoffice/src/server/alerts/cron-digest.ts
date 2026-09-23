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
import {
  REJECTIONS_UNAVAILABLE,
  rejectionWindowStart,
  summarizeRejections,
  type RejectionSource,
  type RejectionSummary,
} from './rejections';

export interface DigestCronDeps {
  /** `CRON_SECRET`. */
  readonly secret: string | undefined;
  readonly now: () => Date;
  readonly repo: SupportItemRepository;
  /** N-05's follow-up: expired-session pruning, run after the mail so a
   * prune failure never costs the digest. Its count goes to the log only. */
  readonly pruneSessions?: () => Promise<number>;
  /** N-61: drop geographic counters past their retention. */
  readonly pruneGeo?: () => Promise<number>;
  /** N-18: expire approvals the tenant ignored for 14 days, and purge the
   * files of rows resolved 30+ days ago (LFPDPPP). Same rule as the
   * sessions: housekeeping never costs the digest. */
  readonly expireAssisted?: () => Promise<number>;
  readonly purgeAssistedFiles?: () => Promise<number>;
  /** B-18's rejection digest; a failed read renders «no disponible», it does not stop the email. */
  readonly rejections: RejectionSource;
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

async function readRejections(
  deps: DigestCronDeps,
  now: Date,
  log: NonNullable<DigestCronDeps['log']>,
): Promise<RejectionSummary> {
  try {
    return summarizeRejections(await deps.rejections.since(rejectionWindowStart(now)));
  } catch (error) {
    log('digest: reading sync rejections failed', error);
    return REJECTIONS_UNAVAILABLE;
  }
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

  const rejections = await readRejections(deps, now, log);
  const digest = buildDailyDigest(items, now, { consoleUrl: deps.consoleUrl, rejections });
  const prunedSessions = await pruneSessions(deps, log);
  const prunedGeo = await pruneGeo(deps, log);
  const assisted = await assistedSweeps(deps, log);
  try {
    await deps.mailer.send({
      to: deps.to,
      subject: digest.subject,
      text: digest.text,
      html: digest.html,
      sections: digest.emailSections,
      idempotencyKey: `staff-digest:${digest.window.start.toISOString()}`,
    });
  } catch (error) {
    log('digest: sending failed', error);
    return reply(502, { error: 'mail_failed' });
  }
  return reply(200, {
    ok: true,
    subject: digest.subject,
    counts: digest.counts,
    prunedSessions,
    prunedGeo,
    expiredAssisted: assisted.expired,
    purgedAssistedFiles: assisted.purgedFiles,
  });
}

/** N-05's prune; null when the step is not wired, failures only log. */
async function pruneSessions(
  deps: DigestCronDeps,
  log: NonNullable<DigestCronDeps['log']>,
): Promise<number | null> {
  if (deps.pruneSessions === undefined) return null;
  try {
    return await deps.pruneSessions();
  } catch (error) {
    log('digest: pruning staff sessions failed', error);
    return null;
  }
}

/** N-61's retention sweep; same contract as the one above. */
async function pruneGeo(
  deps: DigestCronDeps,
  log: NonNullable<DigestCronDeps['log']>,
): Promise<number | null> {
  if (deps.pruneGeo === undefined) return null;
  try {
    return await deps.pruneGeo();
  } catch (error) {
    log('digest: pruning geo counters failed', error);
    return null;
  }
}

/** N-18's housekeeping pair; failures log, never cost the digest. */
async function assistedSweeps(
  deps: DigestCronDeps,
  log: NonNullable<DigestCronDeps['log']>,
): Promise<{ readonly expired: number; readonly purgedFiles: number }> {
  try {
    return {
      expired: deps.expireAssisted ? await deps.expireAssisted() : 0,
      purgedFiles: deps.purgeAssistedFiles ? await deps.purgeAssistedFiles() : 0,
    };
  } catch (error) {
    log('digest: assisted-import sweeps failed', error);
    return { expired: 0, purgedFiles: 0 };
  }
}
