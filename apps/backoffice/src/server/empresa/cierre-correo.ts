import 'server-only';

import type { Founder } from '@xangarro/data-corp';
import type { GenericNoticeProps } from '@xangarro/email';

import { avisarAlOtroSocio } from './aviso-socio';
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
  await avisarAlOtroSocio({
    quien: input.quien,
    correo: (url) => correoReapertura(input.periodo, input.quien.nombre, input.motivo, url),
    kind: 'corp-reapertura',
    clave: input.periodo,
  });
}
