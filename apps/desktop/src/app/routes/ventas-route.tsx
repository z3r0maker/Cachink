/**
 * Desktop route adapter for /ventas — inline POS (ADR-048).
 *
 * Mirrors `apps/mobile/src/app/ventas.tsx` with the state-router's
 * `navigate` in place of Expo's `useRouter`. App-shell only per
 * CLAUDE.md §5.6.
 */

import { useMemo, useState, type ReactElement } from 'react';
import {
  CorteHomeCard,
  VentaConfirmSheet,
  VentaDetailPopover,
  VentasScreen,
  buildQuickSellPayload,
  shareComprobante,
  totalDelDia,
  useClientsForBusiness,
  useComprobanteHtml,
  useCurrentBusiness,
  useEliminarVenta,
  useProductos,
  useProductosConStock,
  useRegistrarVenta,
  useRole,
  useVentasByDate,
} from '@cachink/ui';
import type { Business, Client, ClientId, IsoDate, PaymentMethod, Product, ProductId, Sale } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

function useShareComprobante(
  selected: Sale | null,
  business: Business | null,
  onDone: () => void,
): () => void {
  const html = useComprobanteHtml(selected, business);
  return () => {
    if (!selected || !business || !html) {
      onDone();
      return;
    }
    const concepto = selected.concepto;
    void shareComprobante({
      title: `Comprobante — ${concepto}`,
      text: `${concepto} — ${selected.fecha}`,
      html,
      filenameStem: `comprobante-${selected.id}`,
    }).finally(onDone);
  };
}

function useStockMap(stockQ: { data?: readonly { producto: Product; stock: number }[] }) {
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
      <VentaDetailPopover
        open={props.selected !== null}
        venta={props.selected}
        onClose={() => props.setSelected(null)}
        onShare={props.handleShare}
        onDelete={() => {
          if (props.selected) {
            props.eliminar.mutate({ id: props.selected.id, fecha: props.selected.fecha });
            props.setSelected(null);
          }
        }}
        deleting={props.eliminar.isPending}
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
  const role = useRole();
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));
  const stockMap = useStockMap(stockQ);
  const handleQuickSell = makeQuickSellHandler(productosQ, business, fecha, registrar, setConfirmProduct);
  return {
    fecha, setFecha, search, setSearch, confirmProduct, setConfirmProduct,
    selected, setSelected, ventasQ, productosQ, clientesQ, business,
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
        selected={d.selected}
        setSelected={d.setSelected}
        handleShare={d.handleShare}
        eliminar={d.eliminar}
      />
    </DesktopAppShellWrapper>
  );
}
