import { PeriodoCerradoError, periodOf } from '@xangarro/domain/corp';

import type { FormState } from '../actions/form-state';
import { hoyEnMexico } from '../db/corp';
import { hrefCierre } from './cierre-view';
import { nombreMes } from './fechas';

/**
 * A capture dated in a closed month (E-14, board CD-10b «Registrar en un mes
 * cerrado»): which month, the open one to use instead, and the way to the
 * month's close. Null for any other error, or a date that is not one.
 */
export function mesCerrado(error: unknown, hoy: string = hoyEnMexico()): FormState {
  if (!(error instanceof PeriodoCerradoError)) return null;
  const periodo = periodOf(error.fecha);
  if (periodo === null) return null;
  const mes = nombreMes(periodo);
  const Mes = `${mes.charAt(0).toUpperCase()}${mes.slice(1)}`;
  return {
    ok: false,
    message: `${Mes} está cerrado. Registra con una fecha de ${nombreMes(hoy.slice(0, 7))}, o pide reabrir ${mes} para registrarlo ahí. Reabrir lo tiene que aprobar el otro socio.`,
    enlace: { texto: `Ir al cierre de ${mes}`, href: hrefCierre(periodo) },
  };
}
