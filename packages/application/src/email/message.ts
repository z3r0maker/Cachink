/**
 * The `EmailSender` port (B-14) and the message it carries.
 *
 * The body arrives **already rendered** (`html` + `text`): templates are
 * React Email components in `@xangarro/email`, rendered there, so this layer
 * stays free of React and of any provider SDK. Every adapter — Resend, the dev
 * outbox, the in-memory fake — therefore sends exactly the same bytes.
 */
import { EmailSendError } from './errors.js';

export interface EmailTag {
  /** ASCII letters, digits, `_` or `-` (Resend's rule), ≤ 256 chars. */
  readonly name: string;
  readonly value: string;
}

/** What a template renders to. */
export interface EmailContent {
  readonly subject: string;
  readonly html: string;
  /** The plain-text alternative; every email has one. */
  readonly text: string;
}

export interface EmailMessage extends EmailContent {
  readonly to: string;
  readonly tags: readonly EmailTag[];
  /**
   * The provider sends one email per key (Resend keeps keys 24 h), so a retry
   * or a re-run cron cannot send twice. Shape: `kind:subject-id:date`.
   */
  readonly idempotencyKey: string;
  readonly replyTo?: string;
}

export type EmailSendResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly error: EmailSendError };

export interface EmailSender {
  send(message: EmailMessage): Promise<EmailSendResult>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAG = /^[\w-]{1,256}$/;
export const MAX_IDEMPOTENCY_KEY = 256;

function problem(message: EmailMessage): string | null {
  if (!EMAIL.test(message.to)) return 'destinatario inválido';
  if (message.replyTo !== undefined && !EMAIL.test(message.replyTo)) return 'reply-to inválido';
  if (message.subject.trim() === '') return 'asunto vacío';
  if (message.html === '' || message.text === '') return 'cuerpo vacío';
  if (message.tags.some((t) => !TAG.test(t.name) || !TAG.test(t.value))) return 'etiqueta inválida';
  const key = message.idempotencyKey;
  if (key === '' || key.length > MAX_IDEMPOTENCY_KEY) return 'llave de idempotencia inválida';
  return null;
}

/** `null` when the message can be sent; otherwise a non-retryable error. */
export function validateEmailMessage(message: EmailMessage): EmailSendError | null {
  const why = problem(message);
  return why === null ? null : new EmailSendError('EMAIL_INVALID_MESSAGE', why);
}
