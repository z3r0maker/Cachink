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
import { hrefCierre } from './cierre-view';
import { nombreMes } from './fechas';

/**
 * «Le avisamos a <el otro socio> por correo» (E-14, board CD-10b): a request
 * to reopen a month reaches the founder who has to answer it. The request is
 * already saved; a failed email is logged, never undone or retried here.
 */
export function correoReapertura(
  periodo: string,
  quien: string,
  motivo: string,
  consoleUrl: string,
): GenericNoticeProps {
  const mes = nombreMes(periodo);
  const subject = `MEXIA: ${quien} pidió reabrir ${mes}`;
  return {
    subject,
    preview: subject,
    paragraphs: [
      `${quien} pidió reabrir ${mes} de ${periodo.slice(0, 4)}: «${motivo}».`,
      `${mes.charAt(0).toUpperCase()}${mes.slice(1)} sigue cerrado hasta que lo apruebes. Si lo apruebas, se abre para los dos y el historial guarda quién lo pidió y quién lo aprobó.`,
    ],
    cta: { label: 'Revisar el pedido', href: `${consoleUrl}${hrefCierre(periodo, 'aprobar')}` },
    reason: 'Te llega porque eres socio de MEXIA, S.A.S.',
  };
}

export async function avisarReapertura(input: {
  readonly periodo: string;
  readonly quien: Founder;
  readonly motivo: string;
}): Promise<void> {
  try {
    const otros = (await listFounders(requireCorpDb())).filter((f) => f.id !== input.quien.id);
    const emails = await emailsDeStaff(
      db(),
      otros.map((f) => f.staffMemberId),
    );
    const content = await renderGenericNoticeEmail(
      correoReapertura(
        input.periodo,
        input.quien.nombre,
        input.motivo,
        process.env.ADMIN_BASE_URL ?? DEFAULT_CONSOLE_URL,
      ),
    );
    const sender = emailSenderFromEnv(process.env);
    for (const f of otros) {
      const to = emails.get(f.staffMemberId);
      if (to === undefined) continue;
      const r = await sender.send({
        to,
        ...content,
        tags: [{ name: 'kind', value: 'corp-reapertura' }],
        idempotencyKey: `corp-reapertura:${input.periodo}:${f.id}:${Date.now()}`,
      });
      if (!r.ok) reportError(r.error, '[empresa] reapertura email failed');
    }
  } catch (error) {
    reportError(error, '[empresa] reapertura email failed');
  }
}
