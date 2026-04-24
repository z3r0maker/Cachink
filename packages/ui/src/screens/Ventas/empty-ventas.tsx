/**
 * EmptyVentas — shown when the selected date has no sales yet. Wraps
 * `<EmptyState>` with the Ventas-specific copy and a primary "Nueva
 * Venta" Btn so the first action is one tap away.
 */

import type { ReactElement } from 'react';
import { Btn, EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface EmptyVentasProps {
  readonly onNuevaVenta: () => void;
}

export function EmptyVentas({ onNuevaVenta }: EmptyVentasProps): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      emoji="🧾"
      title={t('ventas.emptyTitle')}
      description={t('ventas.emptyBody')}
      action={
        <Btn variant="primary" onPress={onNuevaVenta} testID="empty-ventas-cta">
          {t('ventas.newCta')}
        </Btn>
      }
      testID="empty-ventas"
    />
  );
}
