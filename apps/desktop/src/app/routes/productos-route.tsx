/**
 * Desktop route adapter for /productos (UXD-R3, ADR-045).
 * Renamed from /inventario.
 */

import { useMemo, useState, type ReactElement } from 'react';
import {
  InventarioTabBar,
  MovimientosRoute,
  NuevoProductoModal,
  StockScreen,
  filterProductos,
  useCrearProducto,
  useFeatureFlag,
  useProductosConStock,
  type InventarioSubTab,
  type ProductoConStock,
} from '@cachink/ui';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

export function ProductosRoute(): ReactElement {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<InventarioSubTab>('stock');
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useDesktopNavigate();
  const itemsQ = useProductosConStock();
  const crear = useCrearProducto();
  const conversionEnabled = useFeatureFlag('conversionMateriaPrima');
  const items = itemsQ.data ?? [];
  const filtered = useMemo(() => filterProductos(items, query), [items, query]);

  const handleProductoPress = (row: ProductoConStock): void => {
    navigate(`/productos/${row.producto.id}`);
  };

  return (
    <DesktopAppShellWrapper activeTabKey="productos">
      <InventarioTabBar active={tab} onChange={setTab} />
      {tab === 'stock' ? (
        <StockScreen
          query={query}
          onChangeQuery={setQuery}
          items={filtered}
          onNuevoProducto={() => setModalOpen(true)}
          onProductoPress={handleProductoPress}
          loading={itemsQ.isLoading}
          error={itemsQ.error as Error | null}
        />
      ) : (
        <MovimientosRoute />
      )}
      <NuevoProductoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(input) => crear.mutate(input, { onSuccess: () => setModalOpen(false) })}
        submitting={crear.isPending}
        conversionEnabled={conversionEnabled}
      />
    </DesktopAppShellWrapper>
  );
}
