/**
 * State hook and sub-components for VentasRoute (desktop).
 * Extracted to keep ventas-route.tsx under 40-line-function limits.
 */
import { useState, useMemo, useCallback, type ReactElement } from 'react';
import {
  VentaCheckoutSheet,
  VentaDetailPopover,
  VentasScreen,
  buildQuickSellPayload,
  impactLight,
  totalDelDia,
  useCart,
  useCurrentBusiness,
  useEliminarVenta,
  useProductosParaVenta,
  useProductosConStock,
  useRegistrarVenta,
  useStockMap,
  useVentasByDate,
} from '@cachink/ui';
import type { Business, IsoDate, PaymentMethod, Product, Sale } from '@cachink/domain';
import { todayIso, useShareComprobante } from './ventas-route-helpers';

export interface VentasRouteState {
  productosQ: ReturnType<typeof useProductosParaVenta>;
  stockMap: ReturnType<typeof useStockMap>;
  cart: ReturnType<typeof useCart>['state'];
  dispatch: ReturnType<typeof useCart>['dispatch'];
  search: string;
  setSearch: (v: string) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;
  selected: Sale | null;
  setSelected: (v: Sale | null) => void;
  cartQuantities: Map<string, number>;
  handleAddToCart: (p: Product) => void;
  handleCheckoutSubmit: (metodo: PaymentMethod) => Promise<void>;
  ventas: readonly Sale[];
  registrar: ReturnType<typeof useRegistrarVenta>;
  eliminar: ReturnType<typeof useEliminarVenta>;
  business: Business | null;
  handleShare: () => void;
}

function useCheckoutSubmit(
  business: Business | null,
  productosQ: ReturnType<typeof useProductosParaVenta>,
  cart: ReturnType<typeof useCart>['state'],
  fecha: IsoDate,
  registrar: ReturnType<typeof useRegistrarVenta>,
  dispatch: ReturnType<typeof useCart>['dispatch'],
  setCheckoutOpen: (v: boolean) => void,
) {
  return useCallback(
    async (metodo: PaymentMethod) => {
      if (!business) return;
      const products = productosQ.data ?? [];
      for (const item of cart.items) {
        const producto = products.find((p) => p.id === item.productoId);
        if (!producto) continue;
        const payload = buildQuickSellPayload({ producto, business, fecha, metodo });
        try {
          await registrar.mutateAsync({ ...payload, cantidad: item.cantidad });
        } catch (err) {
          console.error('[ventas] checkout error:', (err as Error).message);
          return;
        }
      }
      dispatch({ type: 'clear' });
      setCheckoutOpen(false);
    },
    [business, productosQ.data, cart.items, fecha, registrar, dispatch, setCheckoutOpen],
  );
}

export function useVentasRouteState(): VentasRouteState {
  const [fecha] = useState<IsoDate>(todayIso);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);

  const ventasQ = useVentasByDate(fecha);
  const productosQ = useProductosParaVenta();
  const stockQ = useProductosConStock();
  const business = useCurrentBusiness().data ?? null;
  const registrar = useRegistrarVenta();
  const eliminar = useEliminarVenta();
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));
  const stockMap = useStockMap(stockQ);
  const { state: cart, dispatch } = useCart();

  const cartQuantities = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of cart.items) m.set(item.productoId, item.cantidad);
    return m;
  }, [cart.items]);

  const handleAddToCart = useCallback(
    (p: Product) => {
      impactLight();
      dispatch({ type: 'add', product: p, stock: stockMap.get(p.id) });
    },
    [dispatch, stockMap],
  );

  const handleCheckoutSubmit = useCheckoutSubmit(
    business, productosQ, cart, fecha, registrar, dispatch, setCheckoutOpen,
  );

  return {
    productosQ, stockMap, cart, dispatch,
    search, setSearch, checkoutOpen, setCheckoutOpen,
    selected, setSelected, cartQuantities, handleAddToCart,
    handleCheckoutSubmit, ventas: ventasQ.data ?? [],
    registrar, eliminar, business, handleShare,
  };
}

interface MainContentProps {
  state: VentasRouteState;
  onGoToProductos: () => void;
}

export function VentasMainContent({ state: s, onGoToProductos }: MainContentProps): ReactElement {
  return (
    <VentasScreen
      productos={s.productosQ.data ?? []}
      stockMap={s.stockMap}
      productSearch={s.search}
      onProductSearchChange={s.setSearch}
      onGoToProductos={onGoToProductos}
      cart={s.cart}
      onAddToCart={s.handleAddToCart}
      onRemoveOne={(id) => s.dispatch({ type: 'remove', productoId: id })}
      onRemoveAll={(id) => s.dispatch({ type: 'removeAll', productoId: id })}
      onClearCart={() => s.dispatch({ type: 'clear' })}
      cartQuantities={s.cartQuantities}
      onCheckout={() => s.setCheckoutOpen(true)}
      total={totalDelDia(s.ventas)}
      ventaCount={s.ventas.length}
    />
  );
}

interface SheetsProps {
  state: VentasRouteState;
}

export function VentasSheets({ state: s }: SheetsProps): ReactElement {
  return (
    <>
      <VentaCheckoutSheet
        open={s.checkoutOpen}
        onClose={() => s.setCheckoutOpen(false)}
        items={s.cart.items}
        totalCentavos={s.cart.totalCentavos}
        onSubmit={(metodo) => void s.handleCheckoutSubmit(metodo)}
        submitting={s.registrar.isPending}
        error={s.registrar.error ?? null}
      />
      <VentaDetailPopover
        open={s.selected !== null}
        venta={s.selected}
        onClose={() => s.setSelected(null)}
        onShare={s.handleShare}
        onDelete={() => {
          if (s.selected) {
            s.eliminar.mutate({ id: s.selected.id, fecha: s.selected.fecha });
            s.setSelected(null);
          }
        }}
        deleting={s.eliminar.isPending}
      />
    </>
  );
}
