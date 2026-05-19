/**
 * CartRow + StockImpact — internal sub-components for CartStrip.
 *
 * Extracted to keep cart-strip.tsx under the 200-line budget.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import { Icon } from '../../components/Icon/index';
import { colors, typography } from '../../theme';
import { impactLight, impactMedium } from '../../haptics/index';
import type { CartItem } from '../../hooks/use-cart';

function StockImpact(props: {
  stock: number | undefined;
  qty: number;
}): ReactElement | null {
  if (props.stock === undefined) return null;
  const after = props.stock - props.qty;
  const fg = after < 0 ? colors.red : colors.gray400;
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.regular}
      fontSize={11}
      color={fg}
    >
      Stock: {props.stock} → {after}
    </Text>
  );
}

function CartItemInfo(props: { item: CartItem }): ReactElement {
  return (
    <View flex={1} gap={2}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={13}
        color={colors.black}
        numberOfLines={1}
      >
        {props.item.nombre}
      </Text>
      <StockImpact stock={props.item.stock} qty={props.item.cantidad} />
    </View>
  );
}

function RemoveButton(props: {
  productoId: string;
  onRemoveOne: () => void;
  onRemoveAll: () => void;
}): ReactElement {
  return (
    <Pressable
      testID={`cart-remove-${props.productoId}`}
      onPress={() => { impactLight(); props.onRemoveOne(); }}
      onLongPress={() => { impactMedium(); props.onRemoveAll(); }}
      hitSlop={6}
    >
      <View
        width={28} height={28} borderRadius={14}
        borderWidth={2} borderColor={colors.black}
        alignItems="center" justifyContent="center"
        backgroundColor={colors.gray100}
      >
        <Icon name="minus" size={14} color={colors.black} />
      </View>
    </Pressable>
  );
}

export function CartRow(props: {
  item: CartItem;
  onRemoveOne: () => void;
  onRemoveAll: () => void;
}): ReactElement {
  return (
    <View
      testID={`cart-row-${props.item.productoId}`}
      flexDirection="row"
      alignItems="center"
      paddingVertical={6}
      gap={8}
    >
      <CartItemInfo item={props.item} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={13}
        color={colors.gray600}
      >
        ×{props.item.cantidad}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={13}
        color={colors.black}
        minWidth={64}
        textAlign="right"
      >
        {formatMoney(props.item.precioUnitCentavos * BigInt(props.item.cantidad))}
      </Text>
      <RemoveButton
        productoId={props.item.productoId}
        onRemoveOne={props.onRemoveOne}
        onRemoveAll={props.onRemoveAll}
      />
    </View>
  );
}
