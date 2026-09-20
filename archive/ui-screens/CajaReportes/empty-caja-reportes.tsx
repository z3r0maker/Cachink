/**
 * EmptyState for the Caja Reportes screen — shown when there are no
 * cash drawer turns in the selected period.
 */

import type { ReactElement } from 'react';
import { EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export function EmptyCajaReportes(): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="inbox"
      title={t('cajaReportes.emptyTitle')}
      description={t('cajaReportes.emptyDesc')}
      testID="empty-caja-reportes"
    />
  );
}
