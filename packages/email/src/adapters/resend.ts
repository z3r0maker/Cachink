/**
 * `EmailSender` over Resend (B-14). The message's idempotency key goes out as
 * Resend's `Idempotency-Key` header (SDK option `idempotencyKey`, kept 24 h),
 * so a retried send returns the first email instead of sending a second.
 *
 * The SDK answers `{ data, error }` rather than throwing; its HTTP status maps
 * to our codes (429/5xx retryable). Wrap in `retryingSender` for backoff —
 * `emailSenderFromEnv` does.
 */
import {
  EmailSendError,
  validateEmailMessage,
  type EmailSender,
} from '@xangarro/application/email';
import { Resend } from 'resend';

/** The slice of the SDK we use; tests pass a fake. */
export interface ResendClient {
  emails: {
    send(
      payload: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text: string;
        tags: { name: string; value: string }[];
        replyTo?: string;
      },
      options: { idempotencyKey: string },
    ): Promise<{
      data: { id: string } | null;
      error: { message: string; statusCode: number | null; name: string } | null;
    }>;
  };
}

export interface ResendSenderOptions {
  readonly apiKey: string;
  /** `Xangarro <hola@xangarro.mx>`; the domain must be verified in Resend. */
  readonly from: string;
  readonly replyTo?: string;
  readonly client?: ResendClient;
}

function toError(error: { message: string; statusCode: number | null; name: string }) {
  // Two sends with one key racing: Resend says 409 — wait and ask again.
  if (error.name === 'concurrent_idempotent_requests') {
    return new EmailSendError('EMAIL_RATE_LIMITED', error.message, error.statusCode);
  }
  return EmailSendError.fromStatus(error.statusCode, `${error.name}: ${error.message}`);
}

export function resendSender(options: ResendSenderOptions): EmailSender {
  const client: ResendClient = options.client ?? new Resend(options.apiKey);
  return {
    async send(message) {
      const invalid = validateEmailMessage(message);
      if (invalid !== null) return { ok: false, error: invalid };
      const replyTo = message.replyTo ?? options.replyTo;
      const { data, error } = await client.emails.send(
        {
          from: options.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          tags: message.tags.map((t) => ({ name: t.name, value: t.value })),
          ...(replyTo === undefined ? {} : { replyTo }),
        },
        { idempotencyKey: message.idempotencyKey },
      );
      if (error !== null) return { ok: false, error: toError(error) };
      if (data === null) {
        return { ok: false, error: EmailSendError.fromStatus(null, 'Resend answered no id') };
      }
      return { ok: true, id: data.id };
    },
  };
}
