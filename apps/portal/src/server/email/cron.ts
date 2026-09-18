import type { TrialRemindersOutcome } from '@xangarro/application/email';

import { handleCron } from '../cron';

/**
 * `GET /api/cron/trial-emails` — Vercel Cron calls it daily at 15:00 UTC
 * (09:00 in Mexico City). The secret check is the shared `handleCron`.
 */
export interface TrialCronDeps {
  /** `CRON_SECRET`. */
  readonly secret: string | undefined;
  readonly now: () => Date;
  readonly run: (now: Date) => Promise<TrialRemindersOutcome>;
  readonly report: (error: unknown) => void;
}

export function handleTrialEmailsCron(req: Request, deps: TrialCronDeps): Promise<Response> {
  return handleCron(req, { ...deps, failure: 'trial_emails_failed' });
}
