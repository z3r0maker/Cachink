/**
 * EmptyState for the Ventas a Crédito screen — shown when there are no
 * pending credit sales.
 */

import type { ReactElement } from 'react';
import { EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export function EmptyVentasCredito(): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="credit-card"
      title={t('ventasCredito.emptyTitle')}
      description={t('ventasCredito.emptyDesc')}
      testID="empty-ventas-credito"
    />
  );
}
