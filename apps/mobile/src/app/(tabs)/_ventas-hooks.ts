/**
 * State hooks for the /ventas route — keeps VentasRoute ≤ 40 lines.
 * Underscore prefix → Expo Router ignores this file.
 */

import { useMemo, useCallback, useEffect, useRef } from 'react';
import {
  impactLight,
  totalDelDia,
  useCart,
  useCheckoutStore,
  useOpenCajaTurno,
  useProductosParaVenta,
  useProductosConStock,
  useStockMap,
  useVentasByDate,
  type CartAction,
  type CartState,
} from '@xangarro/ui';
import type { IsoDate, Product, Sale } from '@xangarro/domain';

export type { CartAction, CartState };
export { useOpenCajaTurno };

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

export function useVentasQueries(fecha: IsoDate): {
  productos: readonly Product[];
  productosData: readonly Product[] | undefined;
  stockMap: ReadonlyMap<string, number>;
  ventas: readonly Sale[];
  total: bigint;
} {
  const ventasQ = useVentasByDate(fecha);
  const productosQ = useProductosParaVenta();
  const stockQ = useProductosConStock();
  const stockMap = useStockMap(stockQ);
  const ventas = ventasQ.data ?? [];
  return {
    productos: productosQ.data ?? [],
    productosData: productosQ.data,
    stockMap,
    ventas,
    total: totalDelDia(ventas),
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
