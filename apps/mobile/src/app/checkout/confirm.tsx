/**
 * Expo Router entry for /checkout/confirm — card/transfer/QR confirmation.
 *
 * Reads `metodo` from query params. On confirm, records all cart items,
 * clears checkout, pops back, shows Xangarro burst.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { SaleBurst, CheckoutConfirm } from '@xangarro/ui';
import { AppShellWrapper } from '../../shell/app-shell-wrapper';
import { useConfirmState } from './_confirm-hooks';

export default function CheckoutConfirmRoute(): ReactElement {
  const router = useRouter();
  const s = useConfirmState();

  return (
    <AppShellWrapper activeTabKey="ventas" onBack={() => router.back()}>
      <CheckoutConfirm
        totalCentavos={s.totalCentavos}
        metodo={s.metodo}
        onConfirm={s.handleConfirm}
        submitting={s.submitting}
      />
      <SaleBurst
        visible={s.showSaleBurst}
        onComplete={() => s.setShowSaleBurst(false)}
        testID="sale-burst-confirm"
      />
    </AppShellWrapper>
  );
}
