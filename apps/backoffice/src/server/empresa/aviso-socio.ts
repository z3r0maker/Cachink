import 'server-only';

import { listFounders, type Founder } from '@xangarro/data-corp';
import {
  emailSenderFromEnv,
  renderGenericNoticeEmail,
  type GenericNoticeProps,
} from '@xangarro/email';

import { DEFAULT_CONSOLE_URL } from '../alerts/webhook-notifier';
import { db } from '../db/client';
import { requireCorpDb } from '../db/corp';
import { emailsDeStaff } from '../db/staff-emails';
import { reportError } from '../observability/report';

/**
 * «Le avisamos a <el otro socio> por correo» (boards CD-10b and CD-15e):
 * whatever waits on the other founder reaches them by email. What it is
 * about is already saved; a failed email is logged, never undone or retried.
 */
export async function avisarAlOtroSocio(input: {
  readonly quien: Founder;
  /** The notice, given the console's base URL. */
  readonly correo: (consoleUrl: string) => GenericNoticeProps;
  /** The email's kind tag, such as `corp-reapertura`. */
  readonly kind: string;
  /** What it is about, for the idempotency key. */
  readonly clave: string;
}): Promise<void> {
  try {
    const otros = (await listFounders(requireCorpDb())).filter((f) => f.id !== input.quien.id);
    const emails = await emailsDeStaff(
      db(),
      otros.map((f) => f.staffMemberId),
    );
    const content = await renderGenericNoticeEmail(
      input.correo(process.env.ADMIN_BASE_URL ?? DEFAULT_CONSOLE_URL),
    );
    const sender = emailSenderFromEnv(process.env);
    for (const f of otros) {
      const to = emails.get(f.staffMemberId);
      if (to === undefined) continue;
      const r = await sender.send({
        to,
        ...content,
        tags: [{ name: 'kind', value: input.kind }],
        idempotencyKey: `${input.kind}:${input.clave}:${f.id}:${Date.now()}`,
      });
      if (!r.ok) reportError(r.error, `[empresa] ${input.kind} email failed`);
    }
  } catch (error) {
    reportError(error, `[empresa] ${input.kind} email failed`);
  }
}
