/**
 * Expo Router entry for /merma — tap-to-cart shrinkage tracking.
 *
 * Products tap into a merma cart; the batch is settled via
 * MermaCheckoutSheet. Each cart item → a separate inventory movement
 * (tipo='salida', motivo='Merma / daño').
 */
import type { ReactElement } from 'react';
import { MermaScreen, MermaCheckoutSheet } from '@cachink/ui';
import { useMermaState } from './_merma-hooks';

export default function MermaRoute(): ReactElement {
  const s = useMermaState();

  return (
    <>
      <MermaScreen
        productos={s.productos}
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
        testID="merma-route"
      />
      <MermaCheckoutSheet
        open={s.checkoutOpen}
        onClose={() => s.setCheckoutOpen(false)}
        items={s.cart.items}
        onSubmit={s.handleCheckoutSubmit}
        submitting={s.registrar.isPending}
        error={s.registrar.error ?? null}
      />
    </>
  );
}
