/**
 * EmptyState for the Auditoría de Inventario screen — shown when there
 * are no audits recorded yet.
 */

import type { ReactElement } from 'react';
import { EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export function EmptyAuditoria(): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="clipboard-list"
      title={t('auditoria.emptyTitle')}
      description={t('auditoria.emptyDesc')}
      testID="empty-auditoria"
    />
  );
}
