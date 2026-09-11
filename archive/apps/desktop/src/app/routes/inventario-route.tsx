/**
 * Desktop route adapter for /inventario. Mirrors
 * `apps/mobile/src/app/inventario.tsx`. Slice 9.5 T04 + 9.6 T07 + T08
 * complete the wiring: Stock / Movimientos sub-tabs, NuevoProductoModal,
 * and ProductoDetailRoute are all mounted here.
 */

import { useMemo, useState, type ReactElement } from 'react';
import {
  InventarioTabBar,
  MovimientosRoute,
  NuevoProductoModal,
  ProductoDetailRoute,
  StockScreen,
  filterProductos,
  useCrearProducto,
  useProductosConStock,
  type InventarioSubTab,
  type ProductoConStock,
} from '@cachink/ui';
import type { IsoDate } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

interface StockSlotProps {
  readonly query: string;
  readonly onChangeQuery: (q: string) => void;
  readonly items: readonly ProductoConStock[];
  readonly itemsQ: ReturnType<typeof useProductosConStock>;
  readonly onNuevoProducto: () => void;
  readonly onProductoPress: (row: ProductoConStock) => void;
}

function StockSlot(props: StockSlotProps): ReactElement {
  return (
    <StockScreen
      query={props.query}
      onChangeQuery={props.onChangeQuery}
      items={props.items}
      onNuevoProducto={props.onNuevoProducto}
      onProductoPress={props.onProductoPress}
      loading={props.itemsQ.isLoading}
      error={props.itemsQ.error as Error | null}
    />
  );
}

export function InventarioRoute(): ReactElement {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<InventarioSubTab>('stock');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ProductoConStock | null>(null);
  const itemsQ = useProductosConStock();
  const crear = useCrearProducto();
  const items = itemsQ.data ?? [];
  const filtered = useMemo(() => filterProductos(items, query), [items, query]);

  return (
    <DesktopAppShellWrapper activeTabKey="inventario">
      <InventarioTabBar active={tab} onChange={setTab} />
      {tab === 'stock' ? (
        <StockSlot
          query={query}
          onChangeQuery={setQuery}
          items={filtered}
          itemsQ={itemsQ}
          onNuevoProducto={() => setModalOpen(true)}
          onProductoPress={setSelected}
        />
      ) : (
        <MovimientosRoute />
      )}
      <NuevoProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(input) => crear.mutate(input, { onSuccess: () => setModalOpen(false) })}
        submitting={crear.isPending}
      />
      <ProductoDetailRoute row={selected} fecha={todayIso()} onClose={() => setSelected(null)} />
    </DesktopAppShellWrapper>
  );
}
