/**
 * Expo Router entry for /productos (UXD-R3, ADR-045).
 *
 * A stack route opened from Mi turno («Inventario», Track M M-05: it left
 * the tab bar), so it wears the frame with the way back.
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
  useFeatureFlag,
  useProductosConStock,
  type InventarioSubTab,
  type ProductoConStock,
  useTranslation,
} from '@xangarro/ui';
import { AppShellWrapper, useBackTo } from '../../shell/app-shell-wrapper';

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
  const { t } = useTranslation();
  const back = useBackTo('/turno');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<InventarioSubTab>('stock');
  const itemsQ = useProductosConStock();
  // Without stock on the plan (A-14) Productos is a catalog: no stock, no Movimientos.
  const stockOn = useFeatureFlag('stock');
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
      showStock={stockOn}
      loading={itemsQ.isLoading}
      error={itemsQ.error as Error | null}
    />
  );

  return (
    <AppShellWrapper title={t('shell.nav.turno')} onBack={back}>
      {stockOn && <InventarioTabBar active={tab} onChange={setTab} />}
      <ProductosBody
        tab={stockOn ? tab : 'stock'}
        stockSlot={stockSlot}
        onNext={() => setTab(toggleNext(tab))}
        onPrev={() => setTab(togglePrev(tab))}
      />
    </AppShellWrapper>
  );
}
