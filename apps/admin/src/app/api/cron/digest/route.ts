import { handleDigestCron } from '@/server/alerts/cron-digest';
import { DEFAULT_DIGEST_TO, logMailer } from '@/server/alerts/email';
import { DEFAULT_CONSOLE_URL } from '@/server/alerts/webhook-notifier';
import { db } from '@/server/db/client';
import { drizzleRejectionSource } from '@/server/db/rejections';
import { drizzleSupportItems } from '@/server/db/support-items';

/** The daily staff digest (N-10); see `src/server/alerts/cron-digest.ts`. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  return handleDigestCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    repo: drizzleSupportItems(db()),
    rejections: drizzleRejectionSource(db()),
    // B-14 follow-up: replace with the real transactional-email adapter.
    mailer: logMailer(),
    to: process.env.DIGEST_TO ?? DEFAULT_DIGEST_TO,
    consoleUrl: process.env.ADMIN_BASE_URL ?? DEFAULT_CONSOLE_URL,
  });
}
