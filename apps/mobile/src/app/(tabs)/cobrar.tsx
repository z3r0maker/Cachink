/**
 * Expo Router entry for /cobrar — the tap-to-cart register («Cobrar»; the
 * /ventas route until Track M M-05, where Ventas became the sales list).
 *
 * Logic in _ventas-hooks.ts; sub-components in _ventas-overlays.tsx.
 * (Expo Router ignores underscore-prefixed files as routes.) Payment runs
 * in /checkout; past sales are only cancelled, from the Ventas tab.
 */
import { useCallback, useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import type { IsoDate } from '@xangarro/domain';
import { todayIso } from './_ventas-helpers';
import {
  useCartHelpers,
  useOpenCajaTurno,
  useVentasCartState,
  useVentasQueries,
} from './_ventas-hooks';
import { VentasCajaGate, VentasMainView, VentasProductosGate } from './_ventas-overlays';

function useVentasRouteState() {
  const router = useRouter();
  const [fecha] = useState<IsoDate>(todayIso);
  const [search, setSearch] = useState('');
  const { openTurno, isLoading: turnoLoading } = useOpenCajaTurno();
  const q = useVentasQueries(fecha);
  const { cart, dispatch, setCheckoutCart } = useVentasCartState();
  const { cartQuantities, handleAddToCart } = useCartHelpers(dispatch, q.stockMap, cart.items);
  const onCheckout = useCallback(() => {
    setCheckoutCart(cart);
    router.push('/checkout' as never);
  }, [cart, setCheckoutCart, router]);
  return {
    search,
    setSearch,
    openTurno,
    turnoLoading,
    q,
    cart,
    dispatch,
    cartQuantities,
    handleAddToCart,
    onCheckout,
  };
}

export default function CobrarRoute(): ReactElement {
  const s = useVentasRouteState();
  if (!s.turnoLoading && s.openTurno === null) {
    // Products gate takes priority: no products → nothing to sell
    if (s.q.productosData !== undefined && s.q.productos.length === 0) {
      return <VentasProductosGate />;
    }
    return <VentasCajaGate />;
  }
  return (
    <VentasMainView
      productos={s.q.productos}
      stockMap={s.q.stockMap}
      search={s.search}
      setSearch={s.setSearch}
      cart={s.cart}
      dispatch={s.dispatch}
      cartQuantities={s.cartQuantities}
      handleAddToCart={s.handleAddToCart}
      onCheckout={s.onCheckout}
      total={s.q.total}
      ventaCount={s.q.ventas.length}
    />
  );
}
