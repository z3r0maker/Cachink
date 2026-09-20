/**
 * EmptyState for the Merma Reportes screen — shown when there are no
 * merma movements in the selected period.
 */

import type { ReactElement } from 'react';
import { EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export function EmptyMermaReportes(): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="trending-down"
      title={t('mermaReportes.emptyTitle')}
      description={t('mermaReportes.emptyDesc')}
      testID="empty-merma-reportes"
    />
  );
}
