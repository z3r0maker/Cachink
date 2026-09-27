/**
 * Sub-components for the /ventas route: the two gates and the POS view.
 * Underscore prefix → Expo Router ignores this file.
 */

import type { ReactElement } from 'react';
import { useRouter } from 'expo-router';
import type { Product } from '@xangarro/domain';
import { CajaGateBanner, ProductosGateBanner, VentasScreen, type CartState } from '@xangarro/ui';
import type { CartAction } from './_ventas-hooks';

export function VentasProductosGate(): ReactElement {
  const router = useRouter();
  return <ProductosGateBanner onGoToProductos={() => router.replace('/productos' as never)} />;
}

export function VentasCajaGate(): ReactElement {
  const router = useRouter();
  return <CajaGateBanner onGoToCaja={() => router.replace('/caja' as never)} />;
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
    />
  );
}
