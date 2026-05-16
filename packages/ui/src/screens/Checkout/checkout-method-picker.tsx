/**
 * CheckoutMethodPicker — full-screen payment method selection.
 *
 * Shows the same 4 payment method cards as VentaCheckoutSheet but
 * in a full-screen layout. Tapping a method navigates to the
 * method-specific checkout screen.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text } from '@tamagui/core';
import { formatMoney, type Money, type PaymentMethod } from '@cachink/domain';
import { OptionCardGroup } from '../../components/OptionCardGroup/index';
import { CheckoutSummary } from '../Ventas/checkout-summary';
import { useEnabledPaymentMethods } from '../../hooks/use-enabled-payment-methods';
import type { CartItem } from '../../hooks/use-cart';
import { colors, typography } from '../../theme';
import { PAYMENT_OPTIONS } from '../Ventas/venta-checkout-sheet';
import { Btn } from '../../components/Btn/btn';
import { useMemo, useState } from 'react';

export interface CheckoutMethodPickerProps {
  readonly items: readonly CartItem[];
  readonly totalCentavos: Money;
  /** Called with the selected method to navigate to the right screen. */
  readonly onSelectMethod: (metodo: PaymentMethod) => void;
  readonly testID?: string;
}

export function CheckoutMethodPicker(
  props: CheckoutMethodPickerProps,
): ReactElement {
  const [metodo, setMetodo] = useState<PaymentMethod>('Efectivo');
  const enabledMethods = useEnabledPaymentMethods();

  const visibleOptions = useMemo(
    () => PAYMENT_OPTIONS.filter((o) => enabledMethods.includes(o.key)),
    [enabledMethods],
  );

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 20 }}
      testID={props.testID ?? 'checkout-method-picker'}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={28}
        color={colors.black}
      >
        {`Cobrar ${formatMoney(props.totalCentavos)}`}
      </Text>

      <CheckoutSummary items={props.items} />

      <OptionCardGroup<PaymentMethod>
        label="Método de pago"
        value={metodo}
        onChange={setMetodo}
        options={visibleOptions}
        layout="grid"
        testID="checkout-payment-method"
      />

      <Btn
        variant="primary"
        fullWidth
        size="lg"
        onPress={() => props.onSelectMethod(metodo)}
        disabled={props.items.length === 0}
        testID="checkout-method-continue"
      >
        Continuar
      </Btn>
    </ScrollView>
  );
}
