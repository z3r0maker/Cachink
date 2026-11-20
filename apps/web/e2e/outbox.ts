import { join } from 'node:path';

import { latestMailTo as latestIn, linkIn as linkInDir } from '@xangarro/testing/tenant';

/**
 * The dev email outbox (B-14), bound to the portal's own folder: without
 * `RESEND_API_KEY` the portal writes each message as an `.eml` under
 * `apps/web/.email-outbox/`. The reading lives in `@xangarro/testing/tenant`,
 * which Synth's signup runs share (S-10).
 */
const DIR = join(process.cwd(), '.email-outbox');

/** The newest message to `to`, with its base64 parts decoded, or null. */
export const latestMailTo = (to: string): Promise<string | null> => latestIn(DIR, to);

/** The emailed link's path and token, e.g. `/login/entrar?t=…`. */
export const linkIn = (to: string, path: string): Promise<string | null> =>
  linkInDir(DIR, to, path);
