/**
 * EmptyProductos — shown when the business has no products registered
 * yet. Guides the user to the Productos tab before they can sell.
 *
 * ADR-048: Ventas screen is now product-only. Without products,
 * nothing can be sold.
 */

import type { ReactElement } from 'react';
import { Btn, EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface VentasEmptyProductosProps {
  readonly onGoToProductos?: () => void;
  readonly testID?: string;
}

export function VentasEmptyProductos({ onGoToProductos, testID }: VentasEmptyProductosProps): ReactElement {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="package"
      title={t('ventas.noProductos')}
      description={t('ventas.noProductosBody')}
      action={
        onGoToProductos ? (
          <Btn variant="primary" onPress={onGoToProductos} testID="ventas-go-to-productos">
            {t('ventas.goToProductos')}
          </Btn>
        ) : undefined
      }
      testID={testID ?? 'empty-productos'}
    />
  );
}
