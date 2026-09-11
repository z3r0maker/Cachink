/**
 * Desktop route adapter for /merma — tap-to-cart shrinkage tracking.
 *
 * Mirrors `apps/mobile/src/app/(tabs)/merma.tsx`.
 */
import { type ReactElement } from 'react';
import { MermaScreen } from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useMermaState, MermaOverlays } from './merma-route-helpers';

export function MermaRoute(): ReactElement {
  const s = useMermaState();

  return (
    <DesktopAppShellWrapper activeTabKey="merma">
      <MermaScreen
        productos={s.productosQ.data ?? []}
        stockMap={s.stockMap}
        cart={s.cart}
        onAddToCart={s.handleAddToCart}
        onRemoveOne={(id) => s.dispatch({ type: 'remove', productoId: id })}
        onRemoveAll={(id) => s.dispatch({ type: 'removeAll', productoId: id })}
        onClearCart={() => s.dispatch({ type: 'clear' })}
        cartQuantities={s.cartQuantities}
        onCheckout={() => s.setCheckoutOpen(true)}
        submitting={s.registrar.isPending}
        productSearch={s.search}
        onProductSearchChange={s.setSearch}
        testID="merma-desktop-route"
      />
      <MermaOverlays
        checkoutOpen={s.checkoutOpen}
        onClose={() => s.setCheckoutOpen(false)}
        items={s.cart.items}
        onSubmit={s.handleCheckoutSubmit}
        submitting={s.registrar.isPending}
        error={s.registrar.error ?? null}
      />
    </DesktopAppShellWrapper>
  );
}
