/**
 * Sub-components for the /ventas route overlays and gate.
 * Underscore prefix → Expo Router ignores this file.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import type { PaymentMethod, Product, Sale } from '@cachink/domain';
import {
  CachinkBurst,
  CajaGateBanner,
  CorteHomeCard,
  ProductosGateBanner,
  VentaCheckoutSheet,
  VentasScreen,
  type CartState,
  type EliminarVentaResult,
} from '@cachink/ui';
import type { CartAction } from './_ventas-hooks';
import { DetailSlot, SwipeSlots } from '../../shell/ventas-slots';

export function VentasProductosGate(): ReactElement {
  const router = useRouter();
  return <ProductosGateBanner onGoToProductos={() => router.replace('/productos' as never)} />;
}

export function VentasCajaGate(props: {
  role: string | null;
  setShowCorte: (v: boolean) => void;
}): ReactElement {
  const router = useRouter();
  return (
    <>
      <CajaGateBanner onGoToCaja={() => router.replace('/caja' as never)} />
      {props.role === 'operativo' && (
        <CorteHomeCard hideCard onShowChange={props.setShowCorte} testID="corte-hidden" />
      )}
    </>
  );
}

interface MainViewProps {
  productos: readonly Product[];
  stockMap: ReadonlyMap<string, number>;
  search: string;
  setSearch: (v: string) => void;
  cart: CartState;
  dispatch: React.Dispatch<CartAction>;
  cartQuantities: ReadonlyMap<string, number>;
  handleAddToCart: (p: Product) => void;
  onCheckout: () => void;
  total: bigint;
  ventaCount: number;
  role: string | null;
  showCorte: boolean;
  onCorteOpen: () => void;
}

export function VentasMainView(props: MainViewProps): ReactElement {
  const router = useRouter();
  return (
    <VentasScreen
      productos={props.productos}
      stockMap={props.stockMap}
      productSearch={props.search}
      onProductSearchChange={props.setSearch}
      onGoToProductos={() => router.push('/productos' as never)}
      cart={props.cart}
      onAddToCart={props.handleAddToCart}
      onRemoveOne={(id) => props.dispatch({ type: 'remove', productoId: id })}
      onRemoveAll={(id) => props.dispatch({ type: 'removeAll', productoId: id })}
      onClearCart={() => props.dispatch({ type: 'clear' })}
      cartQuantities={props.cartQuantities}
      onCheckout={props.onCheckout}
      total={props.total}
      ventaCount={props.ventaCount}
      showCorte={props.role === 'operativo' && props.showCorte}
      onCorteOpen={props.onCorteOpen}
    />
  );
}

interface SwipeData {
  editing: Sale | null;
  setEditing: (v: Sale | null) => void;
  confirmDelete: Sale | null;
  setConfirmDelete: (v: Sale | null) => void;
}

interface OverlayProps {
  role: string | null;
  showCorte: boolean;
  setShowCorte: (v: boolean) => void;
  corteOpen: boolean;
  setCorteOpen: (v: boolean) => void;
  checkoutOpen: boolean;
  setCheckoutOpen: (v: boolean) => void;
  cartItems: CartState['items'];
  totalCentavos: bigint;
  handleCheckoutSubmit: (m: PaymentMethod) => Promise<void>;
  submitting: boolean;
  checkoutError: Error | null;
  selected: Sale | null;
  setSelected: (v: Sale | null) => void;
  handleShare: () => void;
  eliminar: EliminarVentaResult;
  swipe: SwipeData;
  showCachink: boolean;
  setShowCachink: (v: boolean) => void;
}

export function VentasOverlays(p: OverlayProps): ReactElement {
  return (
    <>
      <VentasCorteSlot role={p.role} showCorte={p.showCorte} setShowCorte={p.setShowCorte} corteOpen={p.corteOpen} setCorteOpen={p.setCorteOpen} />
      <VentaCheckoutSheet
        open={p.checkoutOpen} onClose={() => p.setCheckoutOpen(false)}
        items={p.cartItems} totalCentavos={p.totalCentavos}
        onSubmit={p.handleCheckoutSubmit} submitting={p.submitting} error={p.checkoutError}
      />
      <DetailSlot selected={p.selected} setSelected={p.setSelected} handleShare={p.handleShare} eliminar={p.eliminar} />
      <SwipeSlots editing={p.swipe.editing} setEditing={p.swipe.setEditing} confirmDelete={p.swipe.confirmDelete} setConfirmDelete={p.swipe.setConfirmDelete} eliminar={p.eliminar} />
      <CachinkBurst visible={p.showCachink} onComplete={() => p.setShowCachink(false)} testID="cachink-burst" />
    </>
  );
}

function VentasCorteSlot(props: {
  role: string | null;
  showCorte: boolean;
  setShowCorte: (v: boolean) => void;
  corteOpen: boolean;
  setCorteOpen: (v: boolean) => void;
}): ReactElement | null {
  if (props.role !== 'operativo') return null;
  return (
    <CorteHomeCard
      hideCard
      onShowChange={props.setShowCorte}
      openExternal={props.corteOpen}
      onModalClose={() => props.setCorteOpen(false)}
      testID="corte-home-card-ventas"
    />
  );
}
