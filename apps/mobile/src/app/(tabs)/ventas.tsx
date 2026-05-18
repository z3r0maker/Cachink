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
  search: string; setSearch: (v: string) => void;
  checkoutOpen: boolean; setCheckoutOpen: (v: boolean) => void;
  showCorte: boolean; setShowCorte: (v: boolean) => void;
  corteOpen: boolean; setCorteOpen: (v: boolean) => void;
} {
  const [fecha] = useState<IsoDate>(todayIso);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showCorte, setShowCorte] = useState(false);
  const [corteOpen, setCorteOpen] = useState(false);
  return { fecha, search, setSearch, checkoutOpen, setCheckoutOpen, showCorte, setShowCorte, corteOpen, setCorteOpen };
}

export default function VentasRoute(): ReactElement {
  const router = useRouter();
  const ls = useVentasLocalState();
  const { openTurno, isLoading: turnoLoading } = useOpenCajaTurno();
  const q = useVentasQueries(ls.fecha);
  const { cart, dispatch, setCheckoutCart } = useVentasCartState();
  const { cartQuantities, handleAddToCart } = useCartHelpers(dispatch, q.stockMap, cart.items);
  const { showCachink, setShowCachink, triggerCachink } = useCachinkTrigger();
  const detail = useVentasDetail(q.business);
  const onDone = useCallback(() => { ls.setCheckoutOpen(false); triggerCachink(); }, [triggerCachink, ls]);
  const handleCheckoutSubmit = useVentasCheckout(q.business, q.productos, cart.items, ls.fecha, q.registrar, dispatch, onDone);

  if (!turnoLoading && openTurno === null) {
    return <VentasCajaGate role={q.role} setShowCorte={ls.setShowCorte} />;
  }

  return (
    <>
      <VentasMainView {...{
        productos: q.productos, stockMap: q.stockMap, search: ls.search, setSearch: ls.setSearch,
        cart, dispatch, cartQuantities, handleAddToCart,
        onCheckout: () => { setCheckoutCart(cart); router.push('/checkout' as never); },
        total: q.total, ventaCount: q.ventas.length,
        role: q.role, showCorte: ls.showCorte, onCorteOpen: () => ls.setCorteOpen(true),
      }} />
      <VentasOverlays {...{
        role: q.role, showCorte: ls.showCorte, setShowCorte: ls.setShowCorte,
        corteOpen: ls.corteOpen, setCorteOpen: ls.setCorteOpen,
        checkoutOpen: ls.checkoutOpen, setCheckoutOpen: ls.setCheckoutOpen,
        cartItems: cart.items, totalCentavos: cart.totalCentavos, handleCheckoutSubmit,
        submitting: q.registrar.isPending, checkoutError: q.registrar.error ?? null,
        ...detail, eliminar: q.eliminar, showCachink, setShowCachink,
      }} />
    </>
  );
}
