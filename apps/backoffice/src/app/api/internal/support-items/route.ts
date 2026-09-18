import { urgentNotifierFromEnv } from '@/server/alerts/webhook-notifier';
import { db } from '@/server/db/client';
import { drizzleSupportItems } from '@/server/db/support-items';
import { handleIngest } from '@/server/ingest/handle';

/** Internal ingestion for inbox items; see `src/server/ingest/handle.ts`. */
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  return handleIngest(request, {
    secret: process.env.ADMIN_INGEST_SECRET,
    repo: drizzleSupportItems(db()),
    createDeps: {
      now: () => new Date(),
      notifier: urgentNotifierFromEnv(process.env, fetch),
    },
  });
}
