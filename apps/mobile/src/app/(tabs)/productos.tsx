/**
 * Expo Router entry for /productos (UXD-R3, ADR-045).
 *
 * The persistent `(tabs)/_layout.tsx` provides the AppShell; this file
 * renders ONLY the content area + overlays.
 *
 * Phase 18: "Nuevo Producto" now navigates to /nuevo-producto (full page)
 * instead of opening a modal.
 */

import { useMemo, useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  InventarioTabBar,
  MovimientosRoute,
  StockScreen,
  SwipeableTabView,
  filterProductos,
  useProductosConStock,
  type InventarioSubTab,
  type ProductoConStock,
} from '@cachink/ui';

function toggleNext(tab: InventarioSubTab): InventarioSubTab {
  return tab === 'stock' ? 'movimientos' : 'stock';
}

function togglePrev(tab: InventarioSubTab): InventarioSubTab {
  return tab === 'movimientos' ? 'stock' : 'stock';
}

function ProductosBody(props: {
  tab: InventarioSubTab;
  stockSlot: ReactElement;
  onNext: () => void;
  onPrev: () => void;
}): ReactElement {
  return (
    <SwipeableTabView onSwipeLeft={props.onNext} onSwipeRight={props.onPrev}>
      {props.tab === 'stock' ? props.stockSlot : <MovimientosRoute />}
    </SwipeableTabView>
  );
}

export default function ProductosRoute(): ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<InventarioSubTab>('stock');
  const itemsQ = useProductosConStock();
  const items = itemsQ.data ?? [];
  const filtered = useMemo(() => filterProductos(items, query), [items, query]);

  const handleProductoPress = (row: ProductoConStock): void => {
    router.push(`/productos/${row.producto.id}` as never);
  };

  const stockSlot = (
    <StockScreen
      query={query}
      onChangeQuery={setQuery}
      items={filtered}
      onNuevoProducto={() => router.push('/nuevo-producto' as never)}
      onProductoPress={handleProductoPress}
      loading={itemsQ.isLoading}
      error={itemsQ.error as Error | null}
    />
  );

  return (
    <>
      <InventarioTabBar active={tab} onChange={setTab} />
      <ProductosBody
        tab={tab}
        stockSlot={stockSlot}
        onNext={() => setTab(toggleNext(tab))}
        onPrev={() => setTab(togglePrev(tab))}
      />
    </>
  );
}
