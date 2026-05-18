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
  useProductFormStore,
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
  const storeIcon = useProductFormStore((s) => s.draft?.icono ?? null);
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
        onSubmit={(input) => {
          const payload = storeIcon ? { ...input, icono: storeIcon } : input;
          crear.mutate(payload, {
            onSuccess: () => {
              useProductFormStore.getState().clear();
              setModalOpen(false);
            },
          });
        }}
        submitting={crear.isPending}
        conversionEnabled={conversionEnabled}
        onPickIcon={() => {
          useProductFormStore.getState().setDraft({
            nombre: '',
            sku: '',
            categoria: 'Producto Terminado',
            usoProducto: 'venta',
            costoPesos: '',
            precioVentaPesos: '',
            unidad: 'pza',
            umbral: '3',
            colorFondo: 'white',
            icono: storeIcon,
            editingProductId: null,
          });
          navigate('/productos/icon-picker');
        }}
      />
    </DesktopAppShellWrapper>
  );
}
