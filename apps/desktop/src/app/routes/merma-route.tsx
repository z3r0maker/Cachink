/**
 * Desktop route adapter for /merma — tap-to-cart shrinkage tracking.
 *
 * Mirrors `apps/mobile/src/app/(tabs)/merma.tsx`.
 */
import { useState, useMemo, useCallback, type ReactElement } from 'react';
import {
  MermaScreen,
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
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export function MermaRoute(): ReactElement {
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

  const handleCheckoutSubmit = useCallback(
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
    [businessId, cart.items, registrar, dispatch],
  );

  return (
    <DesktopAppShellWrapper activeTabKey="merma">
      <MermaScreen
        productos={productosQ.data ?? []}
        stockMap={stockMap}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveOne={(id) => dispatch({ type: 'remove', productoId: id })}
        onRemoveAll={(id) => dispatch({ type: 'removeAll', productoId: id })}
        onClearCart={() => dispatch({ type: 'clear' })}
        cartQuantities={cartQuantities}
        onCheckout={() => setCheckoutOpen(true)}
        submitting={registrar.isPending}
        productSearch={search}
        onProductSearchChange={setSearch}
        testID="merma-desktop-route"
      />
      <MermaCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        onSubmit={handleCheckoutSubmit}
        submitting={registrar.isPending}
        error={registrar.error ?? null}
      />
    </DesktopAppShellWrapper>
  );
}
