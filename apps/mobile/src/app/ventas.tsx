/**
 * Expo Router entry for /ventas — inline POS surface (ADR-048).
 *
 * The Ventas screen IS the product picker. Product cards live directly
 * on the screen surface. Tapping a card opens VentaConfirmSheet (small
 * bottom sheet: quantity + payment method). No more free-text modal.
 */

import { useMemo, useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  CorteHomeCard,
  VentaConfirmSheet,
  VentasScreen,
  buildQuickSellPayload,
  totalDelDia,
  useClientsForBusiness,
  useCurrentBusiness,
  useEliminarVenta,
  useProductos,
  useProductosConStock,
  useRegistrarVenta,
  useRole,
  useVentasByDate,
} from '@cachink/ui';
import type { Business, Client, ClientId, IsoDate, PaymentMethod, Product, ProductId, Sale } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';
import { useSwipeState } from '../shell/use-swipe-state';
import { DetailSlot, SwipeSlots, useShareComprobante } from '../shell/ventas-slots';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

function useStockMap(stockQ: { data?: readonly { producto: { id: string }; stock: number }[] }) {
  return useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stockQ.data ?? []) map.set(row.producto.id, row.stock);
    return map;
  }, [stockQ.data]);
}

function makeQuickSellHandler(
  productosQ: { data?: readonly Product[] },
  business: Business | null,
  fecha: IsoDate,
  registrar: ReturnType<typeof useRegistrarVenta>,
  setConfirmProduct: (p: Product | null) => void,
) {
  return (data: { productoId: ProductId; cantidad: number; metodo: PaymentMethod; clienteId?: ClientId }): void => {
    const product = productosQ.data?.find((p) => p.id === data.productoId);
    if (!product || !business) return;
    const payload = buildQuickSellPayload({ producto: product, business, fecha, metodo: data.metodo });
    registrar.mutate(
      { ...payload, cantidad: data.cantidad, clienteId: data.clienteId },
      { onSuccess: () => setConfirmProduct(null) },
    );
  };
}

function VentasOverlays(props: {
  confirmProduct: Product | null;
  setConfirmProduct: (p: Product | null) => void;
  handleQuickSell: ReturnType<typeof makeQuickSellHandler>;
  clientes: readonly Client[];
  registrarPending: boolean;
  selected: Sale | null;
  setSelected: (s: Sale | null) => void;
  handleShare: () => void;
  eliminar: ReturnType<typeof useEliminarVenta>;
  swipe: ReturnType<typeof useSwipeState<Sale>>;
}): ReactElement {
  return (
    <>
      <VentaConfirmSheet
        open={props.confirmProduct !== null}
        onClose={() => props.setConfirmProduct(null)}
        product={props.confirmProduct}
        onSubmit={props.handleQuickSell}
        clientes={props.clientes}
        submitting={props.registrarPending}
      />
      <DetailSlot
        selected={props.selected}
        setSelected={props.setSelected}
        handleShare={props.handleShare}
        eliminar={props.eliminar}
      />
      <SwipeSlots
        editing={props.swipe.editing}
        setEditing={props.swipe.setEditing}
        confirmDelete={props.swipe.confirmDelete}
        setConfirmDelete={props.swipe.setConfirmDelete}
        eliminar={props.eliminar}
      />
    </>
  );
}

function useVentasRouteData() {
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [search, setSearch] = useState('');
  const [confirmProduct, setConfirmProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState<Sale | null>(null);
  const ventasQ = useVentasByDate(fecha);
  const productosQ = useProductos();
  const stockQ = useProductosConStock();
  const clientesQ = useClientsForBusiness();
  const business = useCurrentBusiness().data ?? null;
  const registrar = useRegistrarVenta();
  const eliminar = useEliminarVenta();
  const swipe = useSwipeState<Sale>();
  const role = useRole();
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));
  const stockMap = useStockMap(stockQ);
  const handleQuickSell = makeQuickSellHandler(productosQ, business, fecha, registrar, setConfirmProduct);
  return {
    fecha, setFecha, search, setSearch, confirmProduct, setConfirmProduct,
    selected, setSelected, ventasQ, productosQ, clientesQ, business,
    registrar, eliminar, swipe, role, handleShare, stockMap, handleQuickSell,
  };
}

export default function VentasRoute(): ReactElement {
  const router = useRouter();
  const d = useVentasRouteData();

  return (
    <AppShellWrapper activeTabKey="ventas">
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
        onGoToProductos={() => router.push('/productos' as never)}
        onVentaPress={d.setSelected}
        onEditVenta={d.swipe.setEditing}
        onEliminarVenta={d.swipe.setConfirmDelete}
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
        selected={d.selected}
        setSelected={d.setSelected}
        handleShare={d.handleShare}
        eliminar={d.eliminar}
        swipe={d.swipe}
      />
    </AppShellWrapper>
  );
}
