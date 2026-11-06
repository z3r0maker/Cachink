import 'server-only';

import type { DeletionNotices } from '@xangarro/application/cuenta';
import type { EmailSender } from '@xangarro/application/email';
import {
  renderDeletionErasedEmail,
  renderDeletionReminderEmail,
  renderDeletionRequestedEmail,
} from '@xangarro/email';

import { sendReported } from '../email/sender';

/**
 * The account deletion emails (ADR-136), to the account's own address. Each is
 * keyed by its kind and folio, so a retried run never sends one twice. The
 * confirmation and the reminder each carry a single-use undo link of their own.
 */
export interface DeletionNoticeDeps {
  readonly sender: EmailSender;
  /** The portal's public origin, for the undo links. */
  readonly origin: string;
}

const send = async (
  deps: DeletionNoticeDeps,
  kind: string,
  to: string,
  folio: string,
  content: { subject: string; html: string; text: string },
) => {
  const r = await sendReported(
    deps.sender,
    {
      ...content,
      to,
      tags: [{ name: 'kind', value: `deletion-${kind}` }],
      idempotencyKey: `deletion-${kind}:${folio}`,
    },
    { endpoint: `cuenta/${kind}` },
  );
  if (!r.ok) throw r.error;
};

const undoUrl = (deps: DeletionNoticeDeps, token: string) =>
  `${deps.origin}/eliminacion?t=${encodeURIComponent(token)}`;

export function deletionNotices(deps: DeletionNoticeDeps): DeletionNotices {
  return {
    async requested(n) {
      const content = await renderDeletionRequestedEmail({
        ...n,
        undoUrl: undoUrl(deps, n.undoToken),
      });
      await send(deps, 'requested', n.email, n.folio, content);
    },
    async reminder(n) {
      const content = await renderDeletionReminderEmail({
        ...n,
        undoUrl: undoUrl(deps, n.undoToken),
      });
      await send(deps, 'reminder', n.email, n.folio, content);
    },
    async erased(n) {
      await send(deps, 'erased', n.email, n.folio, await renderDeletionErasedEmail(n));
    },
  };
}
