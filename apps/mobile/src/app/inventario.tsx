/**
 * Expo Router entry for /inventario (P1C-M5, Slice 9.5/9.6 wiring).
 *
 * Renders Stock or Movimientos depending on the inner tab state. Stock
 * rows open ProductoDetailRoute (entrada / salida / eliminar). The
 * "+ Nuevo Producto" Btn opens NuevoProductoModal wired to
 * useCrearProducto.
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
import { AppShellWrapper } from '../shell/app-shell-wrapper';
import { useSwipeState } from '../shell/use-swipe-state';
import { ProductoSwipeSlots } from '../shell/inventario-slots';

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
  readonly onEditProducto: (row: ProductoConStock) => void;
  readonly onConfirmDelete: (row: ProductoConStock) => void;
}

function StockSlot(props: StockSlotProps): ReactElement {
  return (
    <StockScreen
      query={props.query}
      onChangeQuery={props.onChangeQuery}
      items={props.items}
      onNuevoProducto={props.onNuevoProducto}
      onProductoPress={props.onProductoPress}
      onEditProducto={props.onEditProducto}
      onEliminarProducto={props.onConfirmDelete}
      loading={props.itemsQ.isLoading}
      error={props.itemsQ.error as Error | null}
    />
  );
}

interface BodyProps {
  readonly tab: InventarioSubTab;
  readonly stockSlot: ReactElement;
}

function InventarioBody(props: BodyProps): ReactElement {
  return props.tab === 'stock' ? props.stockSlot : <MovimientosRoute />;
}

function useInventarioState(): {
  query: string;
  setQuery: (q: string) => void;
  tab: InventarioSubTab;
  setTab: (t: InventarioSubTab) => void;
  modalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  selected: ProductoConStock | null;
  setSelected: (s: ProductoConStock | null) => void;
  swipe: ReturnType<typeof useSwipeState<ProductoConStock>>;
  itemsQ: ReturnType<typeof useProductosConStock>;
  crear: ReturnType<typeof useCrearProducto>;
  filtered: readonly ProductoConStock[];
} {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<InventarioSubTab>('stock');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ProductoConStock | null>(null);
  const swipe = useSwipeState<ProductoConStock>();
  const itemsQ = useProductosConStock();
  const crear = useCrearProducto();
  const items = itemsQ.data ?? [];
  const filtered = useMemo(() => filterProductos(items, query), [items, query]);
  return {
    query,
    setQuery,
    tab,
    setTab,
    modalOpen,
    setModalOpen,
    selected,
    setSelected,
    swipe,
    itemsQ,
    crear,
    filtered,
  };
}

export default function InventarioRoute(): ReactElement {
  const s = useInventarioState();
  const stockSlot = (
    <StockSlot
      query={s.query}
      onChangeQuery={s.setQuery}
      items={s.filtered}
      itemsQ={s.itemsQ}
      onNuevoProducto={() => s.setModalOpen(true)}
      onProductoPress={s.setSelected}
      onEditProducto={s.swipe.setEditing}
      onConfirmDelete={s.swipe.setConfirmDelete}
    />
  );
  return (
    <AppShellWrapper activeTabKey="inventario">
      <InventarioTabBar active={s.tab} onChange={s.setTab} />
      <InventarioBody tab={s.tab} stockSlot={stockSlot} />
      <NuevoProductoModal
        open={s.modalOpen}
        onClose={() => s.setModalOpen(false)}
        onSubmit={(input) => s.crear.mutate(input, { onSuccess: () => s.setModalOpen(false) })}
        submitting={s.crear.isPending}
      />
      <ProductoDetailRoute
        row={s.selected}
        fecha={todayIso()}
        onClose={() => s.setSelected(null)}
      />
      <ProductoSwipeSlots
        editing={s.swipe.editing}
        setEditing={s.swipe.setEditing}
        confirmDelete={s.swipe.confirmDelete}
        setConfirmDelete={s.swipe.setConfirmDelete}
      />
    </AppShellWrapper>
  );
}
