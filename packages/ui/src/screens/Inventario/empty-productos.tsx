/**
 * EmptyProductos — shown when the catalog is empty or when a buscar
 * filter returns no matches.
 */

import type { ReactElement } from 'react';
import { Btn, EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface EmptyProductosProps {
  readonly onNuevoProducto: () => void;
}

export function EmptyProductos({ onNuevoProducto }: EmptyProductosProps): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      emoji="📦"
      title={t('inventario.emptyTitle')}
      description={t('inventario.emptyBody')}
      action={
        <Btn variant="primary" onPress={onNuevoProducto} testID="empty-productos-cta">
          {t('inventario.newCta')}
        </Btn>
      }
      testID="empty-productos"
    />
  );
}
