/**
 * ProductoListRow — horizontal row layout for the Stock sub-tab.
 *
 * Renamed from `ProductoCard` during UXD-R3 to distinguish from the
 * new vertical `ProductoCard` tile in `components/ProductoCard/`.
 * Shows nombre, categoria Tag, unidad, current stock, costo unitario.
 * Low-stock Tag (red) appears when stock ≤ umbralStockBajo.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import type { Product } from '@cachink/domain';
import { Card, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface ProductoListRowProps {
  readonly producto: Product;
  readonly stock: number;
  readonly onPress?: () => void;
  readonly testID?: string;
}

function ProductoInfo({
  producto,
  isLow,
  bajoStockLabel,
}: {
  producto: Product;
  isLow: boolean;
  bajoStockLabel: string;
}): ReactElement {
  return (
    <View flex={1} paddingRight={12}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={16}
        color={colors.black}
      >
        {producto.nombre}
      </Text>
      <View flexDirection="row" gap={6} marginTop={6} flexWrap="wrap">
        <Tag>{producto.categoria}</Tag>
        <Tag variant="neutral">{producto.unidad}</Tag>
        {isLow && <Tag variant="danger">{bajoStockLabel}</Tag>}
      </View>
    </View>
  );
}

function ProductoAmount({
  stock,
  isLow,
  costo,
}: {
  stock: number;
  isLow: boolean;
  costo: bigint;
}): ReactElement {
  return (
    <View alignItems="flex-end" gap={2}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={20}
        color={isLow ? colors.red : colors.black}
      >
        {stock}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={12}
        color={colors.gray600}
      >
        {formatMoney(costo)}
      </Text>
    </View>
  );
}

export function ProductoListRow(props: ProductoListRowProps): ReactElement {
  const { t } = useTranslation();
  const isLow = props.stock <= props.producto.umbralStockBajo;
  return (
    <Card
      testID={props.testID ?? `producto-row-${props.producto.id}`}
      padding="md"
      onPress={props.onPress}
      fullWidth
    >
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <ProductoInfo
          producto={props.producto}
          isLow={isLow}
          bajoStockLabel={t('inventario.bajoStockTitle')}
        />
        <ProductoAmount
          stock={props.stock}
          isLow={isLow}
          costo={props.producto.costoUnitCentavos}
        />
      </View>
    </Card>
  );
}
