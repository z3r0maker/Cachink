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
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { impactLight, impactMedium } from '../../haptics/index';
import type { CartItem } from '../../hooks/use-cart';

function StockImpact(props: { stock: number | undefined; qty: number }): ReactElement | null {
  if (props.stock === undefined) return null;
  const after = props.stock - props.qty;
  const fg = after < 0 ? colors.redText : colors.textMuted;
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.regular}
      fontSize={fontSizes.xs}
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
        fontSize={fontSizes.sm}
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
  nombre: string;
  onRemoveOne: () => void;
  onRemoveAll: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Pressable
      testID={`cart-remove-${props.productoId}`}
      onPress={() => {
        impactLight();
        props.onRemoveOne();
      }}
      onLongPress={() => {
        impactMedium();
        props.onRemoveAll();
      }}
      role="button"
      aria-label={t('ventas.cartRemoveAriaLabel', { name: props.nombre })}
      // 28pt glyph + 8pt slop each side = 44pt, the iOS HIG floor. Was 6.
      hitSlop={8}
    >
      <View
        width={28}
        height={28}
        borderRadius={14}
        borderWidth={2}
        borderColor={colors.black}
        alignItems="center"
        justifyContent="center"
        backgroundColor={colors.gray100}
      >
        <Icon name="minus" size={14} color={colors.black} />
      </View>
    </Pressable>
  );
}

/** Quantity and line total. Split out to keep `CartRow` inside the §2.6
 *  40-line budget once the remove button carries an accessible name. */
function CartRowAmounts({ item }: { item: CartItem }): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.sm}
        color={colors.gray600}
      >
        ×{item.cantidad}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={fontSizes.sm}
        color={colors.black}
        minWidth={64}
        textAlign="right"
      >
        {formatMoney(item.precioUnitCentavos * BigInt(item.cantidad))}
      </Text>
    </>
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
      <CartRowAmounts item={props.item} />
      <RemoveButton
        productoId={props.item.productoId}
        nombre={props.item.nombre}
        onRemoveOne={props.onRemoveOne}
        onRemoveAll={props.onRemoveAll}
      />
    </View>
  );
}
