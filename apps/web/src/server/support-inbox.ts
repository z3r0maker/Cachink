import 'server-only';

import {
  httpSupportInbox,
  type InboxItemRequest,
  type SupportInbox,
} from '@xangarro/application/support-inbox';

/**
 * The admin inbox from the portal's side (N-08): the CFDI webhook and the
 * crons file items through the console's ingestion endpoint.
 *
 * - `ADMIN_INGEST_URL` — e.g. `https://admin.xangarro.mx/api/internal/support-items`.
 * - `ADMIN_INGEST_SECRET` — the same value the admin project has.
 *
 * With either unset (local development, previews), items become one
 * structured log line each — ids and amounts, the same content — so nothing is
 * lost silently; production must set both.
 */
export function logSupportInbox(log: (line: string) => void = console.warn): SupportInbox {
  return {
    file(item: InboxItemRequest) {
      log(JSON.stringify({ evt: 'support_item_not_sent', ...item }));
      return Promise.resolve();
    },
  };
}

export function supportInboxFromEnv(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SupportInbox {
  const url = env.ADMIN_INGEST_URL?.trim();
  const secret = env.ADMIN_INGEST_SECRET?.trim();
  if (!url || !secret) return logSupportInbox();
  return httpSupportInbox({ url, secret, fetch: (u, init) => fetch(u, init) });
}
