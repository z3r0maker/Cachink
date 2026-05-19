/**
 * Expo Router entry for /ventas — tap-to-cart POS surface.
 *
 * Logic in _ventas-hooks.ts; sub-components in _ventas-overlays.tsx.
 * (Expo Router ignores underscore-prefixed files as routes.)
 */
import { useState, useCallback, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import type { IsoDate } from '@cachink/domain';
import { todayIso } from './_ventas-helpers';
import {
  useCachinkTrigger,
  useCartHelpers,
  useOpenCajaTurno,
  useVentasCartState,
  useVentasCheckout,
  useVentasDetail,
  useVentasQueries,
} from './_ventas-hooks';
import { VentasCajaGate, VentasMainView, VentasOverlays } from './_ventas-overlays';

function useVentasLocalState(): {
  fecha: IsoDate;
  search: string;
  setSearch: (v: string) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;
  showCorte: boolean;
  setShowCorte: (v: boolean) => void;
  corteOpen: boolean;
  setCorteOpen: (v: boolean) => void;
} {
  const [fecha] = useState<IsoDate>(todayIso);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showCorte, setShowCorte] = useState(false);
  const [corteOpen, setCorteOpen] = useState(false);
  return {
    fecha,
    search,
    setSearch,
    checkoutOpen,
    setCheckoutOpen,
    showCorte,
    setShowCorte,
    corteOpen,
    setCorteOpen,
  };
}

function useVentasActions(
  ls: ReturnType<typeof useVentasLocalState>,
  q: ReturnType<typeof useVentasQueries>,
  cart: ReturnType<typeof useVentasCartState>,
) {
  const router = useRouter();
  const { showCachink, setShowCachink, triggerCachink } = useCachinkTrigger();
  const onDone = useCallback(() => {
    ls.setCheckoutOpen(false);
    triggerCachink();
  }, [triggerCachink, ls]);
  const checkout = useVentasCheckout(
    q.business,
    q.productos,
    cart.cart.items,
    ls.fecha,
    q.registrar,
    cart.dispatch,
    onDone,
  );
  const onCheckout = useCallback(() => {
    cart.setCheckoutCart(cart.cart);
    router.push('/checkout' as never);
  }, [cart, router]);
  return { showCachink, setShowCachink, checkout, onCheckout };
}

function useVentasRouteState() {
  const ls = useVentasLocalState();
  const { openTurno, isLoading: turnoLoading } = useOpenCajaTurno();
  const q = useVentasQueries(ls.fecha);
  const cartState = useVentasCartState();
  const { cartQuantities, handleAddToCart } = useCartHelpers(
    cartState.dispatch,
    q.stockMap,
    cartState.cart.items,
  );
  const detail = useVentasDetail(q.business);
  const actions = useVentasActions(ls, q, cartState);
  return {
    ls,
    turnoLoading,
    openTurno,
    q,
    ...cartState,
    cartQuantities,
    handleAddToCart,
    detail,
    ...actions,
  };
}

function VentasMainSection(props: ReturnType<typeof useVentasRouteState>): ReactElement {
  const { ls, q, cart, dispatch, cartQuantities, handleAddToCart, onCheckout } = props;
  return (
    <VentasMainView
      {...{
        productos: q.productos,
        stockMap: q.stockMap,
        search: ls.search,
        setSearch: ls.setSearch,
        cart,
        dispatch,
        cartQuantities,
        handleAddToCart,
        onCheckout,
        total: q.total,
        ventaCount: q.ventas.length,
        role: q.role,
        showCorte: ls.showCorte,
        onCorteOpen: () => ls.setCorteOpen(true),
      }}
    />
  );
}

function VentasOverlaySection(props: ReturnType<typeof useVentasRouteState>): ReactElement {
  const { ls, q, cart, showCachink, setShowCachink, detail, checkout } = props;
  return (
    <VentasOverlays
      {...{
        role: q.role,
        showCorte: ls.showCorte,
        setShowCorte: ls.setShowCorte,
        corteOpen: ls.corteOpen,
        setCorteOpen: ls.setCorteOpen,
        checkoutOpen: ls.checkoutOpen,
        setCheckoutOpen: ls.setCheckoutOpen,
        cartItems: cart.items,
        totalCentavos: cart.totalCentavos,
        handleCheckoutSubmit: checkout,
        submitting: q.registrar.isPending,
        checkoutError: q.registrar.error ?? null,
        ...detail,
        eliminar: q.eliminar,
        showCachink,
        setShowCachink,
      }}
    />
  );
}

export default function VentasRoute(): ReactElement {
  const state = useVentasRouteState();
  if (!state.turnoLoading && state.openTurno === null) {
    return <VentasCajaGate role={state.q.role} setShowCorte={state.ls.setShowCorte} />;
  }
  return (
    <>
      <VentasMainSection {...state} />
      <VentasOverlaySection {...state} />
    </>
  );
}
