/**
 * StockBajoBanner — red Card that surfaces when any producto is at or
 * below its umbralStockBajo (Slice 2 C20).
 *
 * Shown at the top of StockScreen. Tapping the Ver Btn applies a
 * bajo-stock filter to the list (parent controls the filtered state).
 * Hidden entirely when count is zero — one less thing on screen for
 * the common "everything's fine" case.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { ProductoConStock } from '../../hooks/use-productos-con-stock';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export function countBajoStock(items: readonly ProductoConStock[]): number {
  return items.reduce((acc, row) => (row.stock <= row.producto.umbralStockBajo ? acc + 1 : acc), 0);
}

export interface StockBajoBannerProps {
  readonly items: readonly ProductoConStock[];
  readonly onVer?: () => void;
  readonly testID?: string;
}

export function StockBajoBanner(props: StockBajoBannerProps): ReactElement | null {
  const { t } = useTranslation();
  const count = countBajoStock(props.items);
  if (count === 0) return null;
  return (
    <Card testID={props.testID ?? 'stock-bajo-banner'} variant="white" padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <View flex={1} paddingRight={12}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.black}
            fontSize={18}
            color={colors.red}
          >
            {t('inventario.bajoStockTitle')} · {count}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={13}
            color={colors.gray600}
            marginTop={4}
          >
            {t('inventario.bajoStockBody')}
          </Text>
        </View>
        {props.onVer && (
          <Btn variant="danger" size="sm" onPress={props.onVer} testID="stock-bajo-ver">
            {t('inventario.verBajoStock')}
          </Btn>
        )}
      </View>
    </Card>
  );
}
