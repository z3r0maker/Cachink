/**
 * State hooks for the /ventas route — keeps VentasRoute ≤ 40 lines.
 * Underscore prefix → Expo Router ignores this file.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  buildQuickSellPayload,
  impactLight,
  totalDelDia,
  useCart,
  useCachinkSound,
  useCheckoutStore,
  useCurrentBusiness,
  useEliminarVenta,
  useOpenCajaTurno,
  useProductosParaVenta,
  useProductosConStock,
  useRegistrarVenta,
  useRole,
  useStockMap,
  useVentasByDate,
  type CartAction,
  type CartState,
} from '@cachink/ui';
import type { Business, IsoDate, PaymentMethod, Product, Sale } from '@cachink/domain';
import { useCachinkPlayer } from '../../shell/use-cachink-player';
import { useSwipeState } from '../../shell/use-swipe-state';
import { useShareComprobante } from '../../shell/ventas-slots';

export type { CartAction, CartState };
export { useRole, useOpenCajaTurno };

function useCheckoutReturnClear(dispatch: React.Dispatch<CartAction>): void {
  const checkoutCart = useCheckoutStore((s) => s.cart);
  const hadCheckout = useRef(false);
  useEffect(() => {
    if (checkoutCart != null) hadCheckout.current = true;
    if (checkoutCart == null && hadCheckout.current) {
      hadCheckout.current = false;
      dispatch({ type: 'clear' });
    }
  }, [checkoutCart, dispatch]);
}

export function useCachinkTrigger(): {
  showCachink: boolean;
  setShowCachink: (v: boolean) => void;
  triggerCachink: () => void;
} {
  const [showCachink, setShowCachink] = useState(false);
  const cachinkPlayer = useCachinkPlayer();
  const { play: playCachink } = useCachinkSound(cachinkPlayer);
  const triggerCachink = useCallback(() => {
    setShowCachink(true);
    playCachink();
  }, [playCachink]);
  return { showCachink, setShowCachink, triggerCachink };
}

export function useVentasQueries(fecha: IsoDate): {
  productos: readonly Product[];
  productosData: readonly Product[] | undefined;
  stockMap: ReadonlyMap<string, number>;
  business: Business | null;
  registrar: ReturnType<typeof useRegistrarVenta>;
  eliminar: ReturnType<typeof useEliminarVenta>;
  ventas: readonly Sale[];
  total: bigint;
  role: ReturnType<typeof useRole>;
} {
  const ventasQ = useVentasByDate(fecha);
  const productosQ = useProductosParaVenta();
  const stockQ = useProductosConStock();
  const business = useCurrentBusiness().data ?? null;
  const registrar = useRegistrarVenta();
  const eliminar = useEliminarVenta();
  const stockMap = useStockMap(stockQ);
  const role = useRole();
  const ventas = ventasQ.data ?? [];
  return {
    productos: productosQ.data ?? [],
    productosData: productosQ.data,
    stockMap, business, registrar, eliminar, ventas,
    total: totalDelDia(ventas), role,
  };
}

export function useVentasCartState(): {
  cart: CartState;
  dispatch: React.Dispatch<CartAction>;
  setCheckoutCart: (cart: CartState) => void;
} {
  const { state: cart, dispatch } = useCart();
  const setCheckoutCart = useCheckoutStore((s) => s.setCart);
  useCheckoutReturnClear(dispatch);
  return { cart, dispatch, setCheckoutCart };
}

export function useCartHelpers(
  dispatch: React.Dispatch<CartAction>,
  stockMap: ReadonlyMap<string, number>,
  items: CartState['items'],
): {
  cartQuantities: ReadonlyMap<string, number>;
  handleAddToCart: (p: Product) => void;
} {
  const cartQuantities = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of items) m.set(item.productoId, item.cantidad);
    return m;
  }, [items]);

  const handleAddToCart = useCallback(
    (p: Product) => {
      impactLight();
      dispatch({ type: 'add', product: p, stock: stockMap.get(p.id) });
    },
    [dispatch, stockMap],
  );
  return { cartQuantities, handleAddToCart };
}

export function useVentasCheckout(
  business: Business | null,
  productos: readonly Product[],
  cartItems: CartState['items'],
  fecha: IsoDate,
  registrar: ReturnType<typeof useRegistrarVenta>,
  dispatch: React.Dispatch<CartAction>,
  onDone: () => void,
): (metodo: PaymentMethod) => Promise<void> {
  return useCallback(
    async (metodo: PaymentMethod) => {
      if (!business) {
        Alert.alert('Negocio no configurado', 'Configura tu negocio en Ajustes.');
        return;
      }
      for (const item of cartItems) {
        const producto = productos.find((p) => p.id === item.productoId);
        if (!producto) continue;
        try {
          await registrar.mutateAsync({
            ...buildQuickSellPayload({ producto, business, fecha, metodo }),
            cantidad: item.cantidad,
          });
        } catch (err) {
          Alert.alert('Error parcial', (err as Error).message);
          return;
        }
      }
      dispatch({ type: 'clear' });
      onDone();
    },
    [business, productos, cartItems, fecha, registrar, dispatch, onDone],
  );
}

export function useVentasDetail(business: Business | null): {
  selected: Sale | null;
  setSelected: (v: Sale | null) => void;
  handleShare: () => void;
  swipe: ReturnType<typeof useSwipeState<Sale>>;
} {
  const [selected, setSelected] = useState<Sale | null>(null);
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));
  const swipe = useSwipeState<Sale>();
  return { selected, setSelected, handleShare, swipe };
}
