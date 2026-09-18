/**
 * `SupportInbox` over the admin console's ingestion endpoint (N-08):
 * `POST $ADMIN_INGEST_URL` with the shared secret in `x-admin-ingest-secret`.
 * 201 (filed) and 200 (already filed) both succeed. The platform `fetch` is
 * injected, typed structurally so the package needs no DOM lib.
 */

import { SupportInboxError, type InboxItemRequest, type SupportInbox } from './support-inbox.js';

export const INGEST_SECRET_HEADER = 'x-admin-ingest-secret';

export interface InboxHttpInit {
  readonly method: 'POST';
  readonly headers: Record<string, string>;
  readonly body: string;
}

export type InboxFetch = (
  url: string,
  init: InboxHttpInit,
) => Promise<{ readonly status: number; readonly ok: boolean }>;

export interface HttpSupportInboxOptions {
  /** `ADMIN_INGEST_URL`, e.g. `https://admin.xangarro.mx/api/internal/support-items`. */
  readonly url: string;
  /** `ADMIN_INGEST_SECRET`. */
  readonly secret: string;
  readonly fetch: InboxFetch;
}

function failure(status: number): SupportInboxError {
  if (status === 503) return new SupportInboxError('INBOX_DISABLED', 'Ingesta cerrada', true);
  if (status === 401) return new SupportInboxError('INBOX_UNAUTHORIZED', 'Secreto inválido', false);
  if (status >= 400 && status < 500) {
    return new SupportInboxError('INBOX_REJECTED', `Item rechazado (${status})`, false);
  }
  return new SupportInboxError('INBOX_UNAVAILABLE', `Consola no disponible (${status})`, true);
}

export function httpSupportInbox(options: HttpSupportInboxOptions): SupportInbox {
  return {
    async file(item: InboxItemRequest): Promise<void> {
      let response: { readonly status: number; readonly ok: boolean };
      try {
        response = await options.fetch(options.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            [INGEST_SECRET_HEADER]: options.secret,
          },
          body: JSON.stringify(item),
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new SupportInboxError('INBOX_UNAVAILABLE', `Sin conexión: ${reason}`, true);
      }
      if (!response.ok) throw failure(response.status);
    },
  };
}
