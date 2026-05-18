/**
 * CartFooter — sticky "Cobrar / Registrar" bar at the bottom of the
 * screen (Enhancement B).
 *
 * Fixed-position footer visible when `itemCount > 0`. Shows the total
 * and a primary CTA button.
 *
 * Colour variants: `yellow` for Ventas, `red` for Merma (Enhancement G).
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney } from '@cachink/domain';
import type { Money } from '@cachink/domain';
import { Btn } from '../../components/Btn/index';
import { Icon } from '../../components/Icon/index';
import { colors, typography } from '../../theme';
import { notificationSuccess } from '../../haptics/index';

export interface CartFooterProps {
  readonly itemCount: number;
  readonly totalCentavos: Money;
  readonly onCheckout: () => void;
  readonly variant?: 'yellow' | 'red';
  readonly checkoutLabel?: string;
  readonly disabled?: boolean;
  readonly testID?: string;
}

function CartSummaryRow(props: {
  itemCount: number;
  totalCentavos: Money;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8} marginBottom={8}>
      <Icon name="shopping-cart" size={18} color={colors.black} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.black}
      >
        {props.itemCount} producto{props.itemCount !== 1 ? 's' : ''} ·{' '}
        {formatMoney(props.totalCentavos)}
      </Text>
    </View>
  );
}

export function CartFooter(props: CartFooterProps): ReactElement | null {
  if (props.itemCount <= 0) return null;

  const variant = props.variant ?? 'yellow';
  const bg = variant === 'red' ? colors.redSoft : colors.yellowSoft;
  const btnVariant = variant === 'red' ? 'danger' : 'primary';
  const label =
    props.checkoutLabel ?? `Cobrar ${formatMoney(props.totalCentavos)}`;

  return (
    <View
      testID={props.testID ?? 'cart-footer'}
      backgroundColor={bg}
      borderTopWidth={2}
      borderTopColor={colors.black}
      paddingHorizontal={16}
      paddingVertical={12}
    >
      <CartSummaryRow
        itemCount={props.itemCount}
        totalCentavos={props.totalCentavos}
      />
      <Btn
        variant={btnVariant}
        fullWidth
        size="lg"
        onPress={() => {
          notificationSuccess();
          props.onCheckout();
        }}
        disabled={props.disabled}
        testID="cart-checkout-btn"
      >
        {label}
      </Btn>
    </View>
  );
}
