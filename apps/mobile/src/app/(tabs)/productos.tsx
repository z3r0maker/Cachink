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
  ProductoDetailRoute,
  StockScreen,
  SwipeableTabView,
  filterProductos,
  useProductosConStock,
  type InventarioSubTab,
  type ProductoConStock,
} from '@cachink/ui';
import type { IsoDate } from '@cachink/domain';
import { useSwipeState } from '../../shell/use-swipe-state';
import { ProductoSwipeSlots } from '../../shell/inventario-slots';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

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

function ProductosOverlays(props: {
  selected: ProductoConStock | null;
  setSelected: (s: ProductoConStock | null) => void;
  swipe: ReturnType<typeof useSwipeState<ProductoConStock>>;
}): ReactElement {
  return (
    <>
      <ProductoDetailRoute
        row={props.selected}
        fecha={todayIso()}
        onClose={() => props.setSelected(null)}
      />
      <ProductoSwipeSlots
        editing={props.swipe.editing}
        setEditing={props.swipe.setEditing}
        confirmDelete={props.swipe.confirmDelete}
        setConfirmDelete={props.swipe.setConfirmDelete}
      />
    </>
  );
}

export default function ProductosRoute(): ReactElement {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<InventarioSubTab>('stock');
  const [selected, setSelected] = useState<ProductoConStock | null>(null);
  const swipe = useSwipeState<ProductoConStock>();
  const itemsQ = useProductosConStock();
  const items = itemsQ.data ?? [];
  const filtered = useMemo(() => filterProductos(items, query), [items, query]);

  const stockSlot = (
    <StockScreen
      query={query}
      onChangeQuery={setQuery}
      items={filtered}
      onNuevoProducto={() => router.push('/nuevo-producto' as never)}
      onProductoPress={setSelected}
      onEditProducto={swipe.setEditing}
      onEliminarProducto={swipe.setConfirmDelete}
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
      <ProductosOverlays selected={selected} setSelected={setSelected} swipe={swipe} />
    </>
  );
}
