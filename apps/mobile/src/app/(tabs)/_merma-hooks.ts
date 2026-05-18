/**
 * Hooks for the /merma route — extracted to keep functions ≤ 40 lines.
 * Underscore prefix → Expo Router ignores this file.
 */

import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  impactLight,
  useCart,
  useProductos,
  useProductosConStock,
  useStockMap,
  useRegistrarMovimiento,
  useCurrentBusinessId,
} from '@cachink/ui';
import type { BusinessId, IsoDate, Product, ProductId } from '@cachink/domain';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

async function submitMermaItems(
  items: readonly { productoId: string; cantidad: number }[],
  businessId: string,
  registrar: ReturnType<typeof useRegistrarMovimiento>,
  reason: string,
  nota: string | null,
): Promise<boolean> {
  const fecha = todayIso();
  for (const item of items) {
    try {
      await registrar.mutateAsync({
        productoId: item.productoId as ProductId,
        fecha,
        tipo: 'salida',
        cantidad: item.cantidad,
        costoUnitCentavos: 0n,
        motivo: 'Merma / daño',
        nota: nota ? `${reason}: ${nota}` : reason,
        businessId: businessId as BusinessId,
      });
    } catch (err) {
      Alert.alert('Error parcial', (err as Error).message);
      return false;
    }
  }
  return true;
}

function useMermaQueries(): {
  productos: readonly Product[];
  stockMap: ReadonlyMap<string, number>;
  registrar: ReturnType<typeof useRegistrarMovimiento>;
  businessId: string | null;
} {
  const productosQ = useProductos();
  const stockQ = useProductosConStock();
  const stockMap = useStockMap(stockQ);
  const registrar = useRegistrarMovimiento();
  const businessId = useCurrentBusinessId();
  return { productos: productosQ.data ?? [], stockMap, registrar, businessId };
}

export interface MermaState {
  readonly productos: readonly Product[];
  readonly stockMap: ReadonlyMap<string, number>;
  readonly cart: ReturnType<typeof useCart>['state'];
  readonly dispatch: ReturnType<typeof useCart>['dispatch'];
  readonly registrar: ReturnType<typeof useRegistrarMovimiento>;
  readonly checkoutOpen: boolean;
  readonly setCheckoutOpen: (v: boolean) => void;
  readonly search: string;
  readonly setSearch: (v: string) => void;
  readonly cartQuantities: ReadonlyMap<string, number>;
  readonly handleAddToCart: (p: Product) => void;
  readonly handleCheckoutSubmit: (reason: string, nota: string | null) => Promise<void>;
}

export function useMermaState(): MermaState {
  const { productos, stockMap, registrar, businessId } = useMermaQueries();
  const { state: cart, dispatch } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [search, setSearch] = useState('');

  const cartQuantities = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of cart.items) m.set(item.productoId, item.cantidad);
    return m;
  }, [cart.items]);

  const handleAddToCart = useCallback(
    (p: Product) => { impactLight(); dispatch({ type: 'add', product: p }); },
    [dispatch],
  );

  const handleCheckoutSubmit = useCallback(
    async (reason: string, nota: string | null) => {
      if (!businessId) {
        Alert.alert('Negocio no configurado', 'Configura tu negocio en Ajustes.');
        return;
      }
      const ok = await submitMermaItems(cart.items, businessId, registrar, reason, nota);
      if (ok) { dispatch({ type: 'clear' }); setCheckoutOpen(false); }
    },
    [businessId, cart.items, registrar, dispatch],
  );

  return {
    productos, stockMap, cart, dispatch, registrar,
    checkoutOpen, setCheckoutOpen, search, setSearch,
    cartQuantities, handleAddToCart, handleCheckoutSubmit,
  };
}
