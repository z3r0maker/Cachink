/**
 * Expo Router entry for /checkout — payment method picker.
 *
 * Reads the cart from useCheckoutStore (set by the Ventas route
 * before navigating here).
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import type { PaymentMethod } from '@cachink/domain';
import { CheckoutMethodPicker, useCheckoutStore } from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';

export default function CheckoutRoute(): ReactElement {
  const router = useRouter();
  const cart = useCheckoutStore((s) => s.cart);

  return (
    <AppShellWrapper
      activeTabKey="ventas"
      onBack={() => router.back()}
    >
      <CheckoutMethodPicker
        items={cart?.items ?? []}
        totalCentavos={cart?.totalCentavos ?? 0n}
        onSelectMethod={(metodo: PaymentMethod) => {
          if (metodo === 'Efectivo') {
            router.push('/checkout/efectivo' as never);
          } else {
            router.push(`/checkout/confirm?metodo=${metodo}` as never);
          }
        }}
      />
    </AppShellWrapper>
  );
}
