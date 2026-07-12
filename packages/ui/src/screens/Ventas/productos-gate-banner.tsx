/**
 * ProductosGateBanner — blocks the Ventas screen when no products exist.
 *
 * Takes priority over CajaGateBanner: if the business has zero products,
 * there is nothing to sell even with an open caja turno.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/index';
import { EmptyState } from '../../components/EmptyState/index';
import { Icon } from '../../components/Icon/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';

export interface ProductosGateBannerProps {
  readonly onGoToProductos: () => void;
  readonly testID?: string;
}

export function ProductosGateBanner(props: ProductosGateBannerProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1} justifyContent="center" alignItems="center" padding={32}>
      <EmptyState
        icon="package"
        title={t('ventas.productosGateTitle')}
        description={t('ventas.productosGateDescription')}
        action={
          <Btn
            variant="dark"
            size="lg"
            icon={<Icon name="package" size={18} color={colors.white} />}
            onPress={props.onGoToProductos}
            testID="productos-gate-go-to-productos"
          >
            {t('ventas.productosGateCta')}
          </Btn>
        }
        testID={props.testID ?? 'productos-gate-banner'}
      />
    </View>
  );
}
