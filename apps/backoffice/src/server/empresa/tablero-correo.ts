import { nombreTrimestre } from '@xangarro/domain/corp';
import type { GenericNoticeProps } from '@xangarro/email';

import { fechaCorta } from './fechas';
import { hrefTablero } from './tablero-view';

/**
 * The Tablero's two emails to the other partner (E-20): a plan to approve,
 * and a card to review inside its ten days. Pure; `avisarAlOtroSocio` sends
 * them.
 */
const RAZON = 'Te llega porque eres socio de MEXIA, S.A.S.';

export function correoPlan(
  trimestre: string,
  quien: string,
  consoleUrl: string,
): GenericNoticeProps {
  const t = nombreTrimestre(trimestre);
  const subject = `MEXIA: ${quien} envió el plan del ${t}`;
  return {
    subject,
    preview: subject,
    paragraphs: [
      `${quien} envió el plan del ${t} para que lo apruebes.`,
      'Revisa cada entregable, pon tu valor donde falte y apruébalo: desde ese momento los valores se congelan.',
    ],
    cta: {
      label: 'Revisar el plan',
      href: `${consoleUrl}${hrefTablero(trimestre, { panel: 'plan' })}`,
    },
    reason: RAZON,
  };
}

export function correoTerminada(
  t: {
    readonly id: string;
    readonly titulo: string;
    readonly trimestre: string;
    readonly plazo: string;
  },
  quien: string,
  consoleUrl: string,
): GenericNoticeProps {
  const subject = `MEXIA: ${quien} terminó «${t.titulo}»`;
  return {
    subject,
    preview: subject,
    paragraphs: [
      `${quien} marcó «${t.titulo}» como terminado, con su evidencia.`,
      `Tienes hasta el ${fechaCorta(t.plazo)} para objetar. Si no objetas, queda aceptado.`,
    ],
    cta: {
      label: 'Revisar la tarjeta',
      href: `${consoleUrl}${hrefTablero(t.trimestre, { tarjeta: t.id })}`,
    },
    reason: RAZON,
  };
}
