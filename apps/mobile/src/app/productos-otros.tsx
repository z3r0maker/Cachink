/**
 * Expo Router entry for /productos-otros — standalone Productos screen
 * accessed from the Otros grid. Wraps the same Productos content in
 * AppShellWrapper so it gets a back button + bottom tab bar.
 *
 * The tab route `(tabs)/productos.tsx` renders the same content inside
 * the tab layout (no AppShellWrapper needed there).
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
import { AppShellWrapper } from '../shell/app-shell-wrapper';

function toggleNext(tab: InventarioSubTab): InventarioSubTab {
  return tab === 'stock' ? 'movimientos' : 'stock';
}

function togglePrev(tab: InventarioSubTab): InventarioSubTab {
  return tab === 'movimientos' ? 'stock' : 'stock';
}

export default function ProductosOtrosRoute(): ReactElement {
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
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <InventarioTabBar active={tab} onChange={setTab} />
      <SwipeableTabView
        onSwipeLeft={() => setTab(toggleNext(tab))}
        onSwipeRight={() => setTab(togglePrev(tab))}
      >
        {tab === 'stock' ? stockSlot : <MovimientosRoute />}
      </SwipeableTabView>
    </AppShellWrapper>
  );
}
