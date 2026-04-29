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
import type { Business, ClientId, IsoDate, PaymentMethod, Product, ProductId, Sale } from '@cachink/domain';
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

export function VentasRoute(): ReactElement {
  const navigate = useDesktopNavigate();
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

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stockQ.data ?? []) {
      map.set(row.producto.id, row.stock);
    }
    return map;
  }, [stockQ.data]);

  function handleQuickSell(data: {
    productoId: ProductId;
    cantidad: number;
    metodo: PaymentMethod;
    clienteId?: ClientId;
  }): void {
    const product = productosQ.data?.find((p) => p.id === data.productoId);
    if (!product || !business) return;
    const payload = buildQuickSellPayload({
      producto: product,
      business,
      fecha,
      metodo: data.metodo,
    });
    registrar.mutate(
      { ...payload, cantidad: data.cantidad, clienteId: data.clienteId },
      { onSuccess: () => setConfirmProduct(null) },
    );
  }

  return (
    <DesktopAppShellWrapper activeTabKey="ventas">
      {role === 'operativo' && <CorteHomeCard testID="corte-home-card-ventas" />}
      <VentasScreen
        fecha={fecha}
        onChangeFecha={(next) => setFecha(next as IsoDate)}
        ventas={ventasQ.data ?? []}
        total={totalDelDia(ventasQ.data ?? [])}
        productos={productosQ.data ?? []}
        stockMap={stockMap}
        onProductoTap={setConfirmProduct}
        productSearch={search}
        onProductSearchChange={setSearch}
        onGoToProductos={() => navigate('/productos')}
        onVentaPress={setSelected}
        loading={ventasQ.isLoading}
        error={ventasQ.error as Error | null}
        onRetry={() => void ventasQ.refetch()}
      />
      <VentaConfirmSheet
        open={confirmProduct !== null}
        onClose={() => setConfirmProduct(null)}
        product={confirmProduct}
        onSubmit={handleQuickSell}
        clientes={clientesQ.data ?? []}
        submitting={registrar.isPending}
      />
      <VentaDetailPopover
        open={selected !== null}
        venta={selected}
        onClose={() => setSelected(null)}
        onShare={handleShare}
        onDelete={() => {
          if (selected) {
            eliminar.mutate({ id: selected.id, fecha: selected.fecha });
            setSelected(null);
          }
        }}
        deleting={eliminar.isPending}
      />
    </DesktopAppShellWrapper>
  );
}
