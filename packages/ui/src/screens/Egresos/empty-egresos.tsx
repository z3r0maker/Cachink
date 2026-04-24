/**
 * EmptyEgresos — shown when the selected date has no egresos. Wraps
 * `<EmptyState>` with the Egresos copy and a primary "+ Nuevo Egreso"
 * CTA so the first action is one tap away.
 */

import type { ReactElement } from 'react';
import { Btn, EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface EmptyEgresosProps {
  readonly onNuevoEgreso: () => void;
}

export function EmptyEgresos({ onNuevoEgreso }: EmptyEgresosProps): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      emoji="📝"
      title={t('egresos.emptyTitle')}
      description={t('egresos.emptyBody')}
      action={
        <Btn variant="primary" onPress={onNuevoEgreso} testID="empty-egresos-cta">
          {t('egresos.newCta')}
        </Btn>
      }
      testID="empty-egresos"
    />
  );
}
