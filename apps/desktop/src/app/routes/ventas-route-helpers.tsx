/**
 * Pure helpers and derived-state hooks for VentasRoute (desktop).
 * Extracted to keep ventas-route.tsx under the 200-line / 40-line-function
 * limits enforced by ESLint (CLAUDE.md §2 #6).
 */

import { type ReactElement } from 'react';
import {
  VentaConfirmSheet,
  VentaDetailPopover,
  buildQuickSellPayload,
  shareComprobante,
  useComprobanteHtml,
  type useEliminarVenta,
  type useRegistrarVenta,
} from '@cachink/ui';
import type {
  Business,
  Client,
  ClientId,
  IsoDate,
  PaymentMethod,
  Product,
  ProductId,
  Sale,
} from '@cachink/domain';

export function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export function useShareComprobante(
  selected: Sale | null,
  business: Business | null,
  onDone: () => void,
): () => void {
  const html = useComprobanteHtml(selected, business);
  return () => {
    if (!selected || !business || !html) { onDone(); return; }
    void shareComprobante({
      title: `Comprobante — ${selected.concepto}`,
      text: `${selected.concepto} — ${selected.fecha}`,
      html,
      filenameStem: `comprobante-${selected.id}`,
    }).finally(onDone);
  };
}

export function makeQuickSellHandler(
  productosQ: { data?: readonly Product[] },
  business: Business | null,
  fecha: IsoDate,
  registrar: ReturnType<typeof useRegistrarVenta>,
  setConfirmProduct: (p: Product | null) => void,
) {
  return (data: {
    productoId: ProductId;
    cantidad: number;
    metodo: PaymentMethod;
    clienteId?: ClientId;
  }): void => {
    const product = productosQ.data?.find((p) => p.id === data.productoId);
    if (!product || !business) return;
    const payload = buildQuickSellPayload({ producto: product, business, fecha, metodo: data.metodo });
    registrar.mutate(
      { ...payload, cantidad: data.cantidad, clienteId: data.clienteId },
      {
        onSuccess: () => setConfirmProduct(null),
        onError: (error) => { console.error('[ventas] registrar error:', error.message); },
      },
    );
  };
}

interface VentasOverlaysProps {
  confirmProduct: Product | null;
  setConfirmProduct: (p: Product | null) => void;
  handleQuickSell: ReturnType<typeof makeQuickSellHandler>;
  clientes: readonly Client[];
  registrarPending: boolean;
  business: Business | null;
  registrarError: Error | null;
  selected: Sale | null;
  setSelected: (s: Sale | null) => void;
  handleShare: () => void;
  eliminar: ReturnType<typeof useEliminarVenta>;
}

export function VentasOverlays(props: VentasOverlaysProps): ReactElement {
  return (
    <>
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
