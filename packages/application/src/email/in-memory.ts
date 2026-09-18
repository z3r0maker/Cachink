/**
 * The test double for `EmailSender` (B-14): keeps what it was given, answers
 * a repeated idempotency key with the first result (as Resend does), and can
 * be told to fail the next send.
 */
import type { EmailSendError } from './errors.js';
import {
  validateEmailMessage,
  type EmailMessage,
  type EmailSender,
  type EmailSendResult,
} from './message.js';

export class InMemoryEmailSender implements EmailSender {
  readonly sent: EmailMessage[] = [];
  private readonly byKey = new Map<string, EmailSendResult>();
  private pending: EmailSendError[] = [];

  failNext(error: EmailSendError): void {
    this.pending.push(error);
  }

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const invalid = validateEmailMessage(message);
    if (invalid !== null) return { ok: false, error: invalid };
    const forced = this.pending.shift();
    if (forced !== undefined) return { ok: false, error: forced };
    const seen = this.byKey.get(message.idempotencyKey);
    if (seen !== undefined) return seen;
    this.sent.push(message);
    const result = { ok: true, id: `mem_${this.sent.length}` } as const;
    this.byKey.set(message.idempotencyKey, result);
    return result;
  }
}
