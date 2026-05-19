/**
 * Expo Router entry for /checkout/efectivo — cash numpad checkout.
 *
 * Reads the cart total from useCheckoutStore. On confirm, records
 * all cart items as sales with efectivoRecibidoCentavos, clears
 * the cart, pops back, and shows the Cachink burst.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { CachinkBurst, CheckoutEfectivo } from '@cachink/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';
import { useEfectivoState } from './_efectivo-hooks';

export default function CheckoutEfectivoRoute(): ReactElement {
  const router = useRouter();
  const s = useEfectivoState();

  return (
    <AppShellWrapper activeTabKey="ventas" title="Cobrar" onBack={() => router.back()}>
      <CheckoutEfectivo
        totalCentavos={s.totalCentavos}
        onConfirm={s.handleConfirm}
        submitting={s.submitting}
        efectivoEnCaja={s.efectivoEnCaja}
      />
      <CachinkBurst
        visible={s.showCachink}
        onComplete={() => s.setShowCachink(false)}
        testID="cachink-burst-efectivo"
      />
    </AppShellWrapper>
  );
}
