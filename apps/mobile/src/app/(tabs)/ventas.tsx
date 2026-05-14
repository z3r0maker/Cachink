/**
 * Expo Router entry for /ventas — inline POS surface (ADR-048).
 *
 * The persistent `(tabs)/_layout.tsx` provides the AppShell; this file
 * renders ONLY the content area + overlays. Pure helpers extracted to
 * _ventas-helpers.ts (underscore = Expo Router ignores it as a route).
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  CorteHomeCard,
  VentaConfirmSheet,
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
import type { Client, IsoDate, Product, Sale } from '@cachink/domain';
import { useSwipeState } from '../../shell/use-swipe-state';
import { DetailSlot, SwipeSlots, useShareComprobante } from '../../shell/ventas-slots';
import { makeQuickSellHandler, todayIso, useStockMap } from './_ventas-helpers';

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
  const swipe = useSwipeState<Sale>();
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
    registrar, eliminar, swipe, role, handleShare, stockMap, handleQuickSell,
  };
}

function VentasConfirmOverlay(props: {
  confirmProduct: Product | null;
  setConfirmProduct: (p: Product | null) => void;
  handleQuickSell: ReturnType<typeof makeQuickSellHandler>;
  clientes: readonly Client[];
  registrarPending: boolean;
  business: object | null;
  registrarError: Error | null;
}): ReactElement {
  return (
    <VentaConfirmSheet
      open={props.confirmProduct !== null}
      onClose={() => props.setConfirmProduct(null)}
      product={props.confirmProduct}
      onSubmit={props.handleQuickSell}
      clientes={props.clientes}
      submitting={props.registrarPending}
      disabled={!props.business}
      disabledReason={!props.business ? 'Configura tu negocio en Ajustes primero' : undefined}
      error={props.registrarError}
    />
  );
}

function VentasSwipeOverlays(props: {
  swipe: ReturnType<typeof useSwipeState<Sale>>;
  eliminar: ReturnType<typeof useEliminarVenta>;
  selected: Sale | null;
  setSelected: (s: Sale | null) => void;
  handleShare: () => void;
}): ReactElement {
  return (
    <>
      <DetailSlot selected={props.selected} setSelected={props.setSelected}
        handleShare={props.handleShare} eliminar={props.eliminar} />
      <SwipeSlots editing={props.swipe.editing} setEditing={props.swipe.setEditing}
        confirmDelete={props.swipe.confirmDelete}
        setConfirmDelete={props.swipe.setConfirmDelete} eliminar={props.eliminar} />
    </>
  );
}

export default function VentasRoute(): ReactElement {
  const router = useRouter();
  const d = useVentasRouteData();
  return (
    <>
      {d.role === 'operativo' && <CorteHomeCard testID="corte-home-card-ventas" />}
      <VentasScreen
        fecha={d.fecha} onChangeFecha={(next) => d.setFecha(next as IsoDate)}
        ventas={d.ventasQ.data ?? []} total={totalDelDia(d.ventasQ.data ?? [])}
        productos={d.productosQ.data ?? []} stockMap={d.stockMap}
        onProductoTap={d.setConfirmProduct} productSearch={d.search}
        onProductSearchChange={d.setSearch}
        onGoToProductos={() => router.push('/productos' as never)}
        onVentaPress={d.setSelected} onEditVenta={d.swipe.setEditing}
        onEliminarVenta={d.swipe.setConfirmDelete}
        loading={d.ventasQ.isLoading} error={d.ventasQ.error as Error | null}
        onRetry={() => void d.ventasQ.refetch()}
      />
      <VentasConfirmOverlay confirmProduct={d.confirmProduct}
        setConfirmProduct={d.setConfirmProduct} handleQuickSell={d.handleQuickSell}
        clientes={d.clientesQ.data ?? []} registrarPending={d.registrar.isPending}
        business={d.business} registrarError={d.registrar.error ?? null} />
      <VentasSwipeOverlays swipe={d.swipe} eliminar={d.eliminar}
        selected={d.selected} setSelected={d.setSelected} handleShare={d.handleShare} />
    </>
  );
}
