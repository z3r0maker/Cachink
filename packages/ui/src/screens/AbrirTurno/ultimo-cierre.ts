/**
 * «Ayer terminaste con $800.00.»: the last close on this device, as the
 * fondo sheet's hint. Pure; the day is said the way «Tus últimos cortes»
 * says it (`etiquetaCorte`).
 */
import { etiquetaCorte } from '@xangarro/caja/inicio';
import { formatMoney } from '@xangarro/domain';
import type { TranslateFunction } from '../../i18n/index';

export interface UltimoCierre {
  /** The turno's business date, `YYYY-MM-DD`. */
  readonly fecha: string;
  /** What was counted at the close, in centavos. */
  readonly monto: bigint;
}

export function textoUltimo(
  t: TranslateFunction,
  u: UltimoCierre | null,
  ahora: Date,
): string | null {
  if (u === null) return null;
  const dia = etiquetaCorte(u.fecha, ahora, '').split(' · ')[0] ?? '';
  const monto = formatMoney(u.monto);
  if (dia === 'Hoy')
    return t('entrar.abrirTurno.ultimo', { cuando: t('entrar.abrirTurno.hoy'), monto });
  if (dia === 'Ayer')
    return t('entrar.abrirTurno.ultimo', { cuando: t('entrar.abrirTurno.ayer'), monto });
  return t('entrar.abrirTurno.ultimoFecha', { dia, monto });
}
