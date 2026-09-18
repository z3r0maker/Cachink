/**
 * Port: send the staff digest by email (N-10).
 *
 * `transactionalMailer` is the real adapter (B-14): it renders the
 * `@xangarro/email` staff-digest template from the digest's sections and
 * sends it through an `EmailSender` (Resend, or the dev outbox without
 * `RESEND_API_KEY` — see `emailSenderFromEnv`). A failed send throws, so the
 * cron answers 502 and Vercel shows the failure.
 *
 * `logMailer` stays for tests and for running the cron with email off: it
 * records that a digest was produced (subject, recipient, sizes — never the
 * body, which carries customer-written titles).
 */
import type { EmailSender } from '@xangarro/application/email';
import { renderStaffDigestEmail, type DigestSection } from '@xangarro/email';

export interface DigestEmail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
  /** The sections as data; the transactional mailer renders its template from them. */
  readonly sections?: readonly DigestSection[];
  /** One digest per window: a re-run cron is answered with the first email. */
  readonly idempotencyKey?: string;
}

export interface Mailer {
  send(email: DigestEmail): Promise<void>;
}

export const DEFAULT_DIGEST_TO = 'soporte@xangarro.mx';

export function logMailer(log: (line: string) => void = console.info): Mailer {
  return {
    async send(email) {
      log(
        `[digest] not sent (email disabled) to=${email.to} subject="${email.subject}" ` +
          `text=${email.text.length}B html=${email.html.length}B`,
      );
    },
  };
}

async function htmlOf(email: DigestEmail): Promise<string> {
  if (email.sections === undefined) return email.html;
  const rendered = await renderStaffDigestEmail({
    subject: email.subject,
    sections: email.sections,
  });
  return rendered.html;
}

export function transactionalMailer(sender: EmailSender): Mailer {
  return {
    async send(email) {
      const result = await sender.send({
        to: email.to,
        subject: email.subject,
        html: await htmlOf(email),
        text: email.text,
        tags: [{ name: 'kind', value: 'staff-digest' }],
        idempotencyKey: email.idempotencyKey ?? `staff-digest:${email.subject}`,
      });
      if (!result.ok) throw result.error;
    },
  };
}
