/**
 * CheckoutSummary — read-only order summary rendered inside checkout
 * modals (VentaCheckoutSheet, MermaCheckoutSheet).
 *
 * Each row: product name · ×qty · subtotal.
 * Final row: separator + total.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type Money } from '@cachink/domain';
import { colors, typography } from '../../theme';
import type { CartItem } from '../../hooks/use-cart';

export interface CheckoutSummaryProps {
  readonly items: readonly CartItem[];
  readonly totalCentavos?: Money;
  readonly testID?: string;
}

function SummaryRow(props: { item: CartItem }): ReactElement {
  const { item } = props;
  const subtotal = item.precioUnitCentavos * BigInt(item.cantidad);
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingVertical={4}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.black}
        flex={1}
        numberOfLines={1}
      >
        {item.nombre}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={13}
        color={colors.gray600}
        marginHorizontal={8}
      >
        ×{item.cantidad}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={13}
        color={colors.black}
      >
        {formatMoney(subtotal)}
      </Text>
    </View>
  );
}

function TotalRow(props: { items: readonly CartItem[]; total: Money }): ReactElement {
  const itemCount = props.items.reduce((sum, i) => sum + i.cantidad, 0);
  return (
    <>
      <View height={1} backgroundColor={colors.gray200} marginVertical={6} />
      <View flexDirection="row" alignItems="center" justifyContent="space-between">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={14}
          color={colors.black}
        >
          Total
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={12}
          color={colors.gray600}
          marginHorizontal={8}
        >
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={14}
          color={colors.black}
        >
          {formatMoney(props.total)}
        </Text>
      </View>
    </>
  );
}

export function CheckoutSummary(props: CheckoutSummaryProps): ReactElement {
  const total = props.totalCentavos ?? props.items.reduce(
    (sum, i) => sum + i.precioUnitCentavos * BigInt(i.cantidad),
    0n,
  );
  return (
    <View testID={props.testID ?? 'checkout-summary'} gap={2}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        color={colors.gray600}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase' }}
        marginBottom={4}
      >
        Resumen del pedido
      </Text>
      {props.items.map((item) => (
        <SummaryRow key={item.productoId} item={item} />
      ))}
      <TotalRow items={props.items} total={total} />
    </View>
  );
}
