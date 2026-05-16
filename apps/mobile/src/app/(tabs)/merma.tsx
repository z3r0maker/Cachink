/**
 * Expo Router entry for /merma — tap-to-cart shrinkage tracking.
 *
 * Products tap into a merma cart; the batch is settled via
 * MermaCheckoutSheet. Each cart item → a separate inventory movement
 * (tipo='salida', motivo='Merma / daño').
 */
import { useState, useMemo, useCallback, type ReactElement } from 'react';
import { Alert } from 'react-native';
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

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export default function MermaRoute(): ReactElement {
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
      if (!businessId) {
        Alert.alert('Negocio no configurado', 'Configura tu negocio en Ajustes.');
        return;
      }
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
          Alert.alert('Error parcial', (err as Error).message);
          return; // stop — cart NOT cleared so user can retry
        }
      }
      dispatch({ type: 'clear' });
      setCheckoutOpen(false);
    },
    [businessId, cart.items, registrar, dispatch],
  );

  return (
    <>
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
        testID="merma-route"
      />
      <MermaCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        onSubmit={handleCheckoutSubmit}
        submitting={registrar.isPending}
        error={registrar.error ?? null}
      />
    </>
  );
}
