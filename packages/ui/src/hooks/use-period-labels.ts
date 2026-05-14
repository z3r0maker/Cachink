/**
 * `usePeriodLabels` — shared hook that returns i18n'd labels for the
 * `<PeriodPicker>` component.
 *
 * Extracted from merma-reportes-screen, caja-reportes-screen,
 * ventas-credito-screen, auditoria-screen, and estados-shell — all
 * five were copy-pasting the exact same function.
 */

import type { PeriodPickerLabels } from '../components/PeriodPicker/period-picker';
import { useTranslation } from '../i18n/index';

export function usePeriodLabels(): PeriodPickerLabels {
  const { t } = useTranslation();
  return {
    mensual: t('estados.periodoMensual'),
    anual: t('estados.periodoAnual'),
    rango: t('estados.periodoRango'),
    mes: t('estados.mesLabel'),
    anio: t('estados.anioLabel'),
    desde: t('estados.fechaDesde'),
    hasta: t('estados.fechaHasta'),
  };
}
