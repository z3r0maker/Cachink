/**
 * Ventas-route slot components — extracted from `app/ventas.tsx` so
 * the route file stays under the §4.4 200-line cap once Audit Round 2
 * K1 added swipe-to-edit + ConfirmDialog plumbing.
 *
 * Each Slot is a pure presentation wrapper around a `<NuevaVentaModal>`
 * / `<VentaDetailPopover>` / `<EditarVentaModal>` / `<ConfirmDialog>`
 * — the route file owns the state, this file owns the JSX.
 */
import type { ReactElement } from 'react';
import { type Router } from 'expo-router';
import {
  ConfirmDialog,
  EditarVentaModal,
  NuevaVentaModal,
  VentaDetailPopover,
  shareComprobante,
  useClientsForBusiness,
  useComprobanteHtml,
  useRegistrarVenta,
  useTranslation,
} from '@cachink/ui';
import type { useEliminarVenta } from '@cachink/ui';
import type { Business, BusinessId, IsoDate, NewSale, Sale } from '@cachink/domain';

export interface NuevaSlotProps {
  open: boolean;
  onClose: () => void;
  fecha: IsoDate;
  businessId: BusinessId;
  router: Router;
}

export function NuevaSlot(props: NuevaSlotProps): ReactElement {
  const clientesQ = useClientsForBusiness();
  const registrar = useRegistrarVenta();
  function handleSubmit(input: NewSale): void {
    registrar.mutate(input, { onSuccess: () => props.onClose() });
  }
  return (
    <NuevaVentaModal
      open={props.open}
      onClose={props.onClose}
      onSubmit={handleSubmit}
      fecha={props.fecha}
      businessId={props.businessId}
      clientes={clientesQ.data ?? []}
      onCrearCliente={() => props.router.push('/clientes' as never)}
      submitting={registrar.isPending}
    />
  );
}

export function useShareComprobante(
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

export interface DetailSlotProps {
  readonly selected: Sale | null;
  readonly setSelected: (s: Sale | null) => void;
  readonly handleShare: () => void;
  readonly eliminar: ReturnType<typeof useEliminarVenta>;
}

export function DetailSlot(props: DetailSlotProps): ReactElement {
  return (
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
  );
}

export interface SwipeSlotsProps {
  readonly editing: Sale | null;
  readonly setEditing: (s: Sale | null) => void;
  readonly confirmDelete: Sale | null;
  readonly setConfirmDelete: (s: Sale | null) => void;
  readonly eliminar: ReturnType<typeof useEliminarVenta>;
}

export function SwipeSlots(props: SwipeSlotsProps): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <EditarVentaModal
        open={props.editing !== null}
        editing={props.editing}
        onClose={() => props.setEditing(null)}
      />
      <ConfirmDialog
        open={props.confirmDelete !== null}
        onClose={() => props.setConfirmDelete(null)}
        onConfirm={() => {
          if (props.confirmDelete) {
            props.eliminar.mutate({
              id: props.confirmDelete.id,
              fecha: props.confirmDelete.fecha,
            });
            props.setConfirmDelete(null);
          }
        }}
        title={t('ventas.delete')}
        confirmLabel={t('ventas.delete')}
        tone="danger"
      />
    </>
  );
}
