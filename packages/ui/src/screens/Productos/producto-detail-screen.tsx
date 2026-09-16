/**
 * ProductoDetailScreen — read-only product detail (A-09).
 *
 * Products are created on the device but edited in the portal, so this page
 * shows what the operator needs at the counter — ícono, precio, código,
 * categoría — plus the stock card with Entrada/Salida, the only product
 * change the device records. No save, no delete.
 */

import type { ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney, resolveProductIcon, type Product } from '@xangarro/domain';
import { Card, Icon } from '../../components/index';
import type { IconName } from '../../components/Icon/icon.shared';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { StockActionCard } from './producto-stock-card';

export interface ProductoDetailScreenProps {
  readonly producto: Product;
  readonly stock: number;
  readonly onEntrada: () => void;
  readonly onSalida: () => void;
  readonly onBack: () => void;
  readonly testID?: string;
}

function DetailHeader(props: { nombre: string; onBack: () => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="center" paddingHorizontal={16} paddingVertical={12}>
      <Pressable
        onPress={props.onBack}
        testID="detail-back"
        role="button"
        aria-label={t('productos.backAriaLabel')}
      >
        <Icon name="chevron-left" size={24} color={colors.black} />
      </Pressable>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.xl}
        color={colors.black}
        numberOfLines={1}
        flex={1}
        textAlign="center"
        marginRight={24}
      >
        {props.nombre}
      </Text>
    </View>
  );
}

function InfoRow(props: { label: string; value: string; testID: string }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" paddingVertical={6}>
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.md} color={colors.gray600}>
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={fontSizes.md}
        color={colors.black}
        testID={props.testID}
      >
        {props.value}
      </Text>
    </View>
  );
}

function ProductInfo(props: { producto: Product }): ReactElement {
  const { t } = useTranslation();
  const p = props.producto;
  return (
    <Card padding="md">
      <InfoRow
        label={t('nuevoProducto.precioVentaLabel')}
        value={formatMoney(p.precioVentaCentavos)}
        testID="detail-precio"
      />
      <InfoRow
        label={t('nuevoProducto.categoriaLabel')}
        value={p.categoria}
        testID="detail-categoria"
      />
      <InfoRow label={t('nuevoProducto.skuLabel')} value={p.sku ?? '—'} testID="detail-sku" />
    </Card>
  );
}

export function ProductoDetailScreen(props: ProductoDetailScreenProps): ReactElement {
  const { t } = useTranslation();
  const p = props.producto;
  const icon = resolveProductIcon(p.icono ?? null, p.categoria) as IconName;
  return (
    <View
      testID={props.testID ?? 'producto-detail-screen'}
      flex={1}
      backgroundColor={colors.offwhite}
    >
      <DetailHeader nombre={p.nombre} onBack={props.onBack} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View alignItems="center" testID="detail-icon">
          <Icon name={icon} size={48} color={colors.black} />
        </View>
        {p.seguirStock !== false && (
          <StockActionCard
            stock={props.stock}
            umbral={p.umbralStockBajo}
            onEntrada={props.onEntrada}
            onSalida={props.onSalida}
          />
        )}
        <ProductInfo producto={p} />
        <Text
          fontFamily={typography.fontFamily}
          fontSize={fontSizes.sm}
          color={colors.gray600}
          textAlign="center"
          testID="detail-portal-hint"
        >
          {t('productos.editInPortal')}
        </Text>
      </ScrollView>
    </View>
  );
}
