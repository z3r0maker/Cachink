import { emailSenderFromEnv } from '@xangarro/email';

import { handleDigestCron } from '@/server/alerts/cron-digest';
import { usageOverLimitSource } from '@/server/alerts/over-limit-source';
import { DEFAULT_DIGEST_TO, transactionalMailer } from '@/server/alerts/email';
import { DEFAULT_CONSOLE_URL } from '@/server/alerts/webhook-notifier';
import { db } from '@/server/db/client';
import { pruneGeoCounters } from '@/server/db/geo-prune';
import { drizzleRejectionSource } from '@/server/db/rejections';
import { expireStaleAssistedImports, purgeResolvedAssistedImportFiles } from '@xangarro/data-pg';
import { pruneStaffSessions } from '@/server/db/staff-sessions-prune';
import { drizzleSupportItems } from '@/server/db/support-items';
import { usageDeps } from '@/server/usage/wiring';

/** The daily staff digest (N-10); see `src/server/alerts/cron-digest.ts`. */
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  return handleDigestCron(request, {
    secret: process.env.CRON_SECRET,
    now: () => new Date(),
    repo: drizzleSupportItems(db()),
    rejections: drizzleRejectionSource(db()),
    overLimit: usageOverLimitSource(usageDeps(db())),
    pruneSessions: () => pruneStaffSessions(db()),
    pruneGeo: () => pruneGeoCounters(db()),
    expireAssisted: () => expireStaleAssistedImports(db()),
    purgeAssistedFiles: () => purgeResolvedAssistedImportFiles(db()),
    // B-14: Resend with RESEND_API_KEY; the dev outbox (.email-outbox/) without it.
    mailer: transactionalMailer(emailSenderFromEnv(process.env)),
    to: process.env.DIGEST_TO ?? DEFAULT_DIGEST_TO,
    consoleUrl: process.env.ADMIN_BASE_URL ?? DEFAULT_CONSOLE_URL,
  });
}
