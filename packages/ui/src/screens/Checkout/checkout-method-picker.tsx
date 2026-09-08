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
import { colors, fontSizes, typography } from '../../theme';
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

function useVisibleMethods() {
  const enabledMethods = useEnabledPaymentMethods();
  return useMemo(
    () => PAYMENT_OPTIONS.filter((o) => enabledMethods.includes(o.key)),
    [enabledMethods],
  );
}

export function CheckoutMethodPicker(props: CheckoutMethodPickerProps): ReactElement {
  const [metodo, setMetodo] = useState<PaymentMethod>('Efectivo');
  const visibleOptions = useVisibleMethods();

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, gap: 20 }}
      testID={props.testID ?? 'checkout-method-picker'}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black.toString()}
        fontSize={fontSizes.xl4}
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
