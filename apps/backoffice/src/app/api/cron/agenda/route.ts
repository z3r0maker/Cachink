import { listFounders } from '@xangarro/data-corp';
import { emailSenderFromEnv } from '@xangarro/email';

import { DEFAULT_CONSOLE_URL } from '@/server/alerts/webhook-notifier';
import { db } from '@/server/db/client';
import { corpDb, hoyEnMexico } from '@/server/db/corp';
import { emailsDeStaff } from '@/server/db/staff-emails';
import { leerAgenda } from '@/server/empresa/agenda-lectura';
import { handleAgendaCron } from '@/server/empresa/cron-agenda';

/** The founders' Agenda reminders (E-04); see `src/server/empresa/cron-agenda.ts`. */
export const dynamic = 'force-dynamic';

async function destinatarios() {
  const corp = corpDb();
  if (corp === null) return [];
  const founders = await listFounders(corp);
  const emails = await emailsDeStaff(
    db(),
    founders.map((f) => f.staffMemberId),
  );
  return founders.flatMap((f) => {
    const email = emails.get(f.staffMemberId);
    return email === undefined ? [] : [{ founderId: f.id, email }];
  });
}

export async function GET(request: Request): Promise<Response> {
  return handleAgendaCron(request, {
    secret: process.env.CRON_SECRET,
    hoy: () => hoyEnMexico(),
    leer: corpDb() === null ? null : async (hoy) => (await leerAgenda(hoy)).vistas,
    destinatarios,
    // B-14: Resend with RESEND_API_KEY; the dev outbox (.email-outbox/) without it.
    sender: emailSenderFromEnv(process.env),
    consoleUrl: process.env.ADMIN_BASE_URL ?? DEFAULT_CONSOLE_URL,
  });
}
