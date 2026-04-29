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
import type { ClientId, IsoDate, PaymentMethod, Product, ProductId, Sale } from '@cachink/domain';
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

export default function VentasRoute(): ReactElement {
  const router = useRouter();
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

  // Build stock map from useProductosConStock
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
    <AppShellWrapper activeTabKey="ventas">
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
        onGoToProductos={() => router.push('/productos' as never)}
        onVentaPress={setSelected}
        onEditVenta={swipe.setEditing}
        onEliminarVenta={swipe.setConfirmDelete}
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
      <DetailSlot
        selected={selected}
        setSelected={setSelected}
        handleShare={handleShare}
        eliminar={eliminar}
      />
      <SwipeSlots
        editing={swipe.editing}
        setEditing={swipe.setEditing}
        confirmDelete={swipe.confirmDelete}
        setConfirmDelete={swipe.setConfirmDelete}
        eliminar={eliminar}
      />
    </AppShellWrapper>
  );
}
