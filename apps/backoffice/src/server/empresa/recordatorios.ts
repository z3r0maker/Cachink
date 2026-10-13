import type { ObligacionVista } from '@xangarro/application/corp';
import { formatDateLong, parseIsoDate } from '@xangarro/domain';
import type { GenericNoticeProps } from '@xangarro/email';

import { hrefDe } from './agenda-view';
import { diasEntre } from './fechas';
import { tituloDe } from './obligacion-view';

/**
 * The Agenda's reminders (E-04): an obligation still open 7, 3 and 1 days
 * before it is due goes into that morning's email to each founder.
 */
export const AVISOS = [7, 3, 1] as const;

export interface Recordatorio {
  readonly titulo: string;
  readonly vence: string;
  readonly dias: number;
  readonly href: string;
}

export function recordatoriosDe(
  vistas: readonly ObligacionVista[],
  hoy: string,
): readonly Recordatorio[] {
  return vistas
    .filter((o) => !o.cumplida)
    .map((o) => ({ o, dias: diasEntre(hoy, o.vence) }))
    .filter(({ dias }) => (AVISOS as readonly number[]).includes(dias))
    .map(({ o, dias }) => ({ titulo: tituloDe(o), vence: o.vence, dias, href: hrefDe(o) }))
    .sort((a, b) => a.dias - b.dias);
}

const cuando = (dias: number) => (dias === 1 ? 'mañana' : `en ${dias} días`);

export function correoDe(
  recordatorios: readonly Recordatorio[],
  consoleUrl: string,
): GenericNoticeProps {
  const primero = recordatorios[0];
  const subject =
    recordatorios.length === 1 && primero !== undefined
      ? `MEXIA: ${primero.titulo} vence ${cuando(primero.dias)}`
      : `MEXIA: ${recordatorios.length} obligaciones vencen pronto`;
  return {
    subject,
    preview: subject,
    paragraphs: [
      'Esto vence pronto en la agenda de MEXIA:',
      ...recordatorios.map(
        (r) => `${r.titulo}: vence ${cuando(r.dias)}, el ${formatDateLong(parseIsoDate(r.vence))}.`,
      ),
      'Recuerda: se marca presentada con su acuse y pagada con su comprobante.',
    ],
    cta: { label: 'Abrir la agenda', href: `${consoleUrl}/empresa/agenda` },
    reason: 'Te llega porque eres socio de MEXIA, S.A.S.',
  };
}
