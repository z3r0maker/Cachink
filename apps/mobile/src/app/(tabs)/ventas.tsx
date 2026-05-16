/**
 * Expo Router entry for /ventas — tap-to-cart POS surface.
 *
 * Products are tapped into a cart; the batch is settled via the
 * VentaCheckoutSheet. Each cart item becomes a separate Sale record.
 *
 * Helpers extracted to _ventas-helpers.ts (Expo Router ignores
 * underscore-prefixed files as routes).
 */
import { useState, useMemo, useCallback, useEffect, useRef, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import { Alert } from 'react-native';
import {
  CachinkBurst,
  CajaGateBanner,
  CorteHomeCard,
  VentaCheckoutSheet,
  VentasScreen,
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
} from '@cachink/ui';
import type { IsoDate, PaymentMethod, Product, Sale } from '@cachink/domain';
import { useSwipeState } from '../../shell/use-swipe-state';
import { DetailSlot, SwipeSlots, useShareComprobante } from '../../shell/ventas-slots';
import { todayIso } from './_ventas-helpers';

export default function VentasRoute(): ReactElement {
  const router = useRouter();
  const { openTurno, isLoading: turnoLoading } = useOpenCajaTurno();
  const [fecha] = useState<IsoDate>(todayIso);
  const [search, setSearch] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [showCachink, setShowCachink] = useState(false);
  const [showCorte, setShowCorte] = useState(false);
  const [corteOpen, setCorteOpen] = useState(false);

  // Data queries
  const ventasQ = useVentasByDate(fecha);
  const productosQ = useProductosParaVenta();
  const stockQ = useProductosConStock();
  const business = useCurrentBusiness().data ?? null;
  const registrar = useRegistrarVenta();
  const eliminar = useEliminarVenta();
  const swipe = useSwipeState<Sale>();
  const role = useRole();
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));
  const stockMap = useStockMap(stockQ);

  // Cart
  const { state: cart, dispatch } = useCart();
  const setCheckoutCart = useCheckoutStore((s) => s.setCart);
  const checkoutCart = useCheckoutStore((s) => s.cart);
  const hadCheckout = useRef(false);

  // Track when checkout starts so we can detect return
  useEffect(() => {
    if (checkoutCart != null) hadCheckout.current = true;
    if (checkoutCart == null && hadCheckout.current) {
      // Checkout completed — clear local cart
      hadCheckout.current = false;
      dispatch({ type: 'clear' });
    }
  }, [checkoutCart, dispatch]);

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

  // Cachink sound
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const cachinkPlayer = useAudioPlayer(require('../../../assets/sounds/cachink.mp3'));
  const { play: playCachink } = useCachinkSound(cachinkPlayer);
  const triggerCachink = useCallback(() => {
    setShowCachink(true);
    playCachink();
  }, [playCachink]);

  // Batch checkout
  const handleCheckoutSubmit = useCallback(
    async (metodo: PaymentMethod) => {
      if (!business) {
        Alert.alert('Negocio no configurado', 'Configura tu negocio en Ajustes.');
        return;
      }
      const products = productosQ.data ?? [];
      for (const item of cart.items) {
        const producto = products.find((p) => p.id === item.productoId);
        if (!producto) continue;
        const payload = buildQuickSellPayload({
          producto,
          business,
          fecha,
          metodo,
        });
        try {
          await registrar.mutateAsync({
            ...payload,
            cantidad: item.cantidad,
          });
        } catch (err) {
          Alert.alert('Error parcial', (err as Error).message);
          return; // stop — cart is NOT cleared so user can retry
        }
      }
      dispatch({ type: 'clear' });
      setCheckoutOpen(false);
      triggerCachink();
    },
    [business, productosQ.data, cart.items, fecha, registrar, dispatch, triggerCachink],
  );

  const ventas = ventasQ.data ?? [];

  // Gate: no open turno → block selling
  if (!turnoLoading && openTurno === null) {
    return (
      <>
        <CajaGateBanner onGoToCaja={() => router.replace('/caja' as never)} />
        {role === 'operativo' && (
          <CorteHomeCard hideCard onShowChange={setShowCorte} testID="corte-hidden" />
        )}
      </>
    );
  }

  return (
    <>
      <VentasScreen
        productos={productosQ.data ?? []}
        stockMap={stockMap}
        productSearch={search}
        onProductSearchChange={setSearch}
        onGoToProductos={() => router.push('/productos' as never)}
        cart={cart}
        onAddToCart={handleAddToCart}
        onRemoveOne={(id) => dispatch({ type: 'remove', productoId: id })}
        onRemoveAll={(id) => dispatch({ type: 'removeAll', productoId: id })}
        onClearCart={() => dispatch({ type: 'clear' })}
        cartQuantities={cartQuantities}
        onCheckout={() => {
          setCheckoutCart(cart);
          router.push('/checkout' as never);
        }}
        total={totalDelDia(ventas)}
        ventaCount={ventas.length}
        showCorte={role === 'operativo' && showCorte}
        onCorteOpen={() => setCorteOpen(true)}
      />
      {role === 'operativo' && (
        <CorteHomeCard
          hideCard
          onShowChange={setShowCorte}
          openExternal={corteOpen}
          onModalClose={() => setCorteOpen(false)}
          testID="corte-home-card-ventas"
        />
      )}
      <VentaCheckoutSheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart.items}
        totalCentavos={cart.totalCentavos}
        onSubmit={handleCheckoutSubmit}
        submitting={registrar.isPending}
        error={registrar.error ?? null}
      />
      <DetailSlot
        selected={selected}
        setSelected={setSelected}
        handleShare={handleShare}
        eliminar={eliminar}
      />
      <SwipeSlots
        editing={swipe.editing}
        setEditing={swipe.setEditing}
        confirmDelete={swipe.confirmDelete}
        setConfirmDelete={swipe.setConfirmDelete}
        eliminar={eliminar}
      />
      <CachinkBurst
        visible={showCachink}
        onComplete={() => setShowCachink(false)}
        testID="cachink-burst"
      />
    </>
  );
}
