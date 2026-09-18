/**
 * Port: send the staff digest by email (N-10).
 *
 * **Stub.** The transactional-email provider is B-14's to choose and wire;
 * until then `logMailer` records that a digest was produced (subject,
 * recipient, sizes — never the body, which carries customer-written titles)
 * so the cron is observable in the Vercel logs. Swapping in the real adapter
 * is a one-line change in `app/api/cron/digest/route.ts`.
 */
export interface DigestEmail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export interface Mailer {
  send(email: DigestEmail): Promise<void>;
}

export const DEFAULT_DIGEST_TO = 'soporte@xangarro.mx';

export function logMailer(log: (line: string) => void = console.info): Mailer {
  return {
    async send(email) {
      log(
        `[digest] not sent (email provider pending, B-14) to=${email.to} subject="${email.subject}" ` +
          `text=${email.text.length}B html=${email.html.length}B`,
      );
    },
  };
}
