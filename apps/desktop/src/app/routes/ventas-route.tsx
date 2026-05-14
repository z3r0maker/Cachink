/**
 * Desktop route adapter for /ventas — inline POS (ADR-048).
 *
 * Mirrors `apps/mobile/src/app/ventas.tsx` with the state-router's
 * `navigate` in place of Expo's `useRouter`. App-shell only per
 * CLAUDE.md §5.6. Helpers extracted to ventas-route-helpers.tsx.
 */

import { useState, type ReactElement } from 'react';
import {
  CorteHomeCard,
  VentasScreen,
  totalDelDia,
  useClientsForBusiness,
  useCurrentBusiness,
  useEliminarVenta,
  useProductosParaVenta,
  useProductosConStock,
  useRegistrarVenta,
  useRole,
  useVentasByDate,
} from '@cachink/ui';
import type { IsoDate, Product, Sale } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';
import {
  VentasOverlays,
  makeQuickSellHandler,
  todayIso,
  useShareComprobante,
  useStockMap,
} from './ventas-route-helpers';

function useVentasRouteData() {
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [search, setSearch] = useState('');
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Sale | null>(null);
  const ventasQ = useVentasByDate(fecha);
  const productosQ = useProductosParaVenta();
  const stockQ = useProductosConStock();
  const clientesQ = useClientsForBusiness();
  const business = useCurrentBusiness().data ?? null;
  const registrar = useRegistrarVenta();
  const eliminar = useEliminarVenta();
  const role = useRole();
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));
  const stockMap = useStockMap(stockQ);
  const handleQuickSell = makeQuickSellHandler(
    productosQ, business, fecha, registrar, setConfirmProduct,
  );
  return {
    fecha, setFecha, search, setSearch,
    confirmProduct, setConfirmProduct, selected, setSelected,
    ventasQ, productosQ, clientesQ, business,
    registrar, eliminar, role, handleShare, stockMap, handleQuickSell,
  };
}

export function VentasRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const d = useVentasRouteData();
  return (
    <DesktopAppShellWrapper activeTabKey="ventas">
      {d.role === 'operativo' && <CorteHomeCard testID="corte-home-card-ventas" />}
      <VentasScreen
        fecha={d.fecha}
        onChangeFecha={(next) => d.setFecha(next as IsoDate)}
        ventas={d.ventasQ.data ?? []}
        total={totalDelDia(d.ventasQ.data ?? [])}
        productos={d.productosQ.data ?? []}
        stockMap={d.stockMap}
        onProductoTap={d.setConfirmProduct}
        productSearch={d.search}
        onProductSearchChange={d.setSearch}
        onGoToProductos={() => navigate('/productos')}
        onVentaPress={d.setSelected}
        loading={d.ventasQ.isLoading}
        error={d.ventasQ.error as Error | null}
        onRetry={() => void d.ventasQ.refetch()}
      />
      <VentasOverlays
        confirmProduct={d.confirmProduct}
        setConfirmProduct={d.setConfirmProduct}
        handleQuickSell={d.handleQuickSell}
        clientes={d.clientesQ.data ?? []}
        registrarPending={d.registrar.isPending}
        business={d.business}
        registrarError={d.registrar.error ?? null}
        selected={d.selected}
        setSelected={d.setSelected}
        handleShare={d.handleShare}
        eliminar={d.eliminar}
      />
    </DesktopAppShellWrapper>
  );
}
