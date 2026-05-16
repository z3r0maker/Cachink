/**
 * Desktop route adapter for /ventas — tap-to-cart POS.
 *
 * Mirrors the mobile route with `navigate` in place of `useRouter`.
 */
import { useState, useMemo, useCallback, type ReactElement } from 'react';
import {
  CajaGateBanner,
  CorteHomeCard,
  VentaCheckoutSheet,
  VentasScreen,
  VentaDetailPopover,
  buildQuickSellPayload,
  impactLight,
  totalDelDia,
  useCart,
  useCurrentBusiness,
  useEliminarVenta,
  useOpenCajaTurno,
  useProductosParaVenta,
  useProductosConStock,
  useRegistrarVenta,
  useRole,
  useStockMap,
  useVentasByDate,
} from '@cachink/ui';
import type { IsoDate, PaymentMethod, Product, Sale } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';
import { todayIso, useShareComprobante } from './ventas-route-helpers';

export function VentasRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const { openTurno, isLoading: turnoLoading } = useOpenCajaTurno();
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
  const role = useRole();
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

  const handleCheckoutSubmit = useCallback(
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
    [business, productosQ.data, cart.items, fecha, registrar, dispatch],
  );

  const ventas = ventasQ.data ?? [];

  // Gate: no open turno → block selling
  if (!turnoLoading && openTurno === null) {
    return (
      <DesktopAppShellWrapper activeTabKey="ventas">
        <CajaGateBanner onGoToCaja={() => navigate('/caja')} />
      </DesktopAppShellWrapper>
    );
  }

  return (
    <DesktopAppShellWrapper activeTabKey="ventas">
      {role === 'operativo' && <CorteHomeCard testID="corte-home-card-ventas" />}
      <VentasScreen
        productos={productosQ.data ?? []}
        stockMap={stockMap}
        productSearch={search}
        onProductSearchChange={setSearch}
        onGoToProductos={() => navigate('/productos')}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveOne={(id) => dispatch({ type: 'remove', productoId: id })}
        onRemoveAll={(id) => dispatch({ type: 'removeAll', productoId: id })}
        onClearCart={() => dispatch({ type: 'clear' })}
        cartQuantities={cartQuantities}
        onCheckout={() => setCheckoutOpen(true)}
        total={totalDelDia(ventas)}
        ventaCount={ventas.length}
      />
      <VentaCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        totalCentavos={cart.totalCentavos}
        onSubmit={(metodo) => void handleCheckoutSubmit(metodo)}
        submitting={registrar.isPending}
        error={registrar.error ?? null}
      />
      <VentaDetailPopover
        open={selected !== null}
        venta={selected}
        onClose={() => setSelected(null)}
        onShare={handleShare}
        onDelete={() => {
          if (selected) {
            eliminar.mutate({ id: selected.id, fecha: selected.fecha });
            setSelected(null);
          }
        }}
        deleting={eliminar.isPending}
      />
    </DesktopAppShellWrapper>
  );
}
