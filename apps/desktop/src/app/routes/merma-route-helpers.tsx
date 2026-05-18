/**
 * Hooks and sub-components for MermaRoute (desktop).
 * Extracted to keep merma-route.tsx under 40-line-function limits.
 */
import { useState, useMemo, useCallback, type ReactElement } from 'react';
import {
  MermaCheckoutSheet,
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

function useMermaCheckout(
  businessId: ReturnType<typeof useCurrentBusinessId>,
  cart: ReturnType<typeof useCart>['state'],
  registrar: ReturnType<typeof useRegistrarMovimiento>,
  dispatch: ReturnType<typeof useCart>['dispatch'],
  setCheckoutOpen: (v: boolean) => void,
) {
  return useCallback(
    async (reason: string, nota: string | null) => {
      if (!businessId) return;
      const fecha = todayIso();
      for (const item of cart.items) {
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
          console.error('[merma] checkout error:', (err as Error).message);
          return;
        }
      }
      dispatch({ type: 'clear' });
      setCheckoutOpen(false);
    },
    [businessId, cart.items, registrar, dispatch, setCheckoutOpen],
  );
}

export function useMermaState() {
  const productosQ = useProductos();
  const stockQ = useProductosConStock();
  const stockMap = useStockMap(stockQ);
  const registrar = useRegistrarMovimiento();
  const businessId = useCurrentBusinessId();
  const { state: cart, dispatch } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [search, setSearch] = useState('');

  const cartQuantities = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of cart.items) m.set(item.productoId, item.cantidad);
    return m;
  }, [cart.items]);

  const handleAddToCart = useCallback(
    (p: Product) => {
      impactLight();
      dispatch({ type: 'add', product: p });
    },
    [dispatch],
  );

  const handleCheckoutSubmit = useMermaCheckout(
    businessId, cart, registrar, dispatch, setCheckoutOpen,
  );

  return {
    productosQ, stockMap, cart, dispatch,
    checkoutOpen, setCheckoutOpen, search, setSearch,
    cartQuantities, handleAddToCart, handleCheckoutSubmit, registrar,
  };
}

interface MermaOverlaysProps {
  checkoutOpen: boolean;
  onClose: () => void;
  items: ReturnType<typeof useCart>['state']['items'];
  onSubmit: (reason: string, nota: string | null) => Promise<void>;
  submitting: boolean;
  error: Error | null;
}

export function MermaOverlays(props: MermaOverlaysProps): ReactElement {
  return (
    <MermaCheckoutSheet
      open={props.checkoutOpen}
      onClose={props.onClose}
      items={props.items}
      onSubmit={props.onSubmit}
      submitting={props.submitting}
      error={props.error}
    />
  );
}
