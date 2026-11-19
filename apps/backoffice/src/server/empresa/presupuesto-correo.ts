import { formatMoney } from '@xangarro/domain';
import { nombreTrimestre, type CategoriaGasto } from '@xangarro/domain/corp';
import type { GenericNoticeProps } from '@xangarro/email';

import { hrefPresupuesto, nombreCategoria } from './presupuesto-view';

/**
 * Presupuesto's two emails to the other founder (E-22, board CD-15e), in the
 * generic notice: a budget to approve, and a request above its founder's
 * Límite. Pure; `avisarAlOtroSocio` sends them.
 */
const RAZON = 'Te llega porque eres socio de MEXIA, S.A.S.';

export function correoPresupuesto(
  trimestre: string,
  quien: string,
  totalMensual: bigint,
  consoleUrl: string,
): GenericNoticeProps {
  const t = nombreTrimestre(trimestre);
  const subject = `MEXIA: ${quien} preparó el presupuesto del ${t}`;
  return {
    subject,
    preview: subject,
    paragraphs: [
      `${quien} preparó el presupuesto del ${t}: ${formatMoney(totalMensual)} al mes en las cuatro categorías.`,
      'Cuenta desde que lo apruebes. Mientras, el trimestre no tiene presupuesto. Si lo rechazas, puede preparar otro.',
    ],
    cta: {
      label: 'Revisar el presupuesto',
      href: `${consoleUrl}${hrefPresupuesto('mes', 'aprobar')}`,
    },
    reason: RAZON,
  };
}

export function correoSolicitud(
  s: {
    readonly id: string;
    readonly concepto: string;
    readonly categoria: CategoriaGasto;
    readonly monto: bigint;
  },
  quien: string,
  consoleUrl: string,
): GenericNoticeProps {
  const subject = `MEXIA: ${quien} pide un gasto de ${formatMoney(s.monto)}`;
  return {
    subject,
    preview: subject,
    paragraphs: [
      `${quien} pide un gasto fuera del presupuesto: «${s.concepto}», ${formatMoney(s.monto)} en ${nombreCategoria(s.categoria)}.`,
      'Rebasa su Límite de gasto sin consultar, así que necesita tu aprobación. Puedes aprobarlo, aprobar otro monto o rechazarlo.',
    ],
    cta: { label: 'Revisar la solicitud', href: `${consoleUrl}${hrefPresupuesto()}` },
    reason: RAZON,
  };
}
