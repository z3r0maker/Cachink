/**
 * Desktop route adapter for /ventas. Mirrors
 * `apps/mobile/src/app/ventas.tsx` with the state-router's `navigate`
 * in place of Expo's `useRouter`. App-shell only per CLAUDE.md §5.6.
 */

import { useState, type ReactElement } from 'react';
import {
  CorteHomeCard,
  NuevaVentaModal,
  VentaDetailPopover,
  VentasScreen,
  shareComprobante,
  totalDelDia,
  useClientsForBusiness,
  useComprobanteHtml,
  useCurrentBusiness,
  useCurrentBusinessId,
  useEliminarVenta,
  useRegistrarVenta,
  useRole,
  useVentasByDate,
} from '@cachink/ui';
import type { Business, BusinessId, IsoDate, NewSale, Sale } from '@cachink/domain';
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';
import { useDesktopNavigate } from '../desktop-router-context';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

function ScreenSlot(props: {
  fecha: IsoDate;
  onChangeFecha: (next: IsoDate) => void;
  onOpen: () => void;
  onSelect: (sale: Sale) => void;
}): ReactElement {
  const ventasQ = useVentasByDate(props.fecha);
  return (
    <VentasScreen
      fecha={props.fecha}
      onChangeFecha={(next) => props.onChangeFecha(next as IsoDate)}
      ventas={ventasQ.data ?? []}
      total={totalDelDia(ventasQ.data ?? [])}
      onNuevaVenta={props.onOpen}
      onVentaPress={props.onSelect}
      loading={ventasQ.isLoading}
      error={ventasQ.error as Error | null}
      onRetry={() => void ventasQ.refetch()}
    />
  );
}

function NuevaSlot(props: {
  open: boolean;
  onClose: () => void;
  fecha: IsoDate;
  businessId: BusinessId;
  navigate: (path: string) => void;
}): ReactElement {
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
      onCrearCliente={() => props.navigate('/clientes')}
      submitting={registrar.isPending}
    />
  );
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

interface DetailSlotProps {
  readonly selected: Sale | null;
  readonly setSelected: (s: Sale | null) => void;
  readonly handleShare: () => void;
  readonly eliminar: ReturnType<typeof useEliminarVenta>;
}

function DetailSlot(props: DetailSlotProps): ReactElement {
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

export function VentasRoute(): ReactElement {
  const navigate = useDesktopNavigate();
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);
  const businessId = useCurrentBusinessId();
  const business = useCurrentBusiness().data ?? null;
  const eliminar = useEliminarVenta();
  const role = useRole();
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));

  return (
    <DesktopAppShellWrapper activeTabKey="ventas">
      {role === 'operativo' && <CorteHomeCard testID="corte-home-card-ventas" />}
      <ScreenSlot
        fecha={fecha}
        onChangeFecha={setFecha}
        onOpen={() => setModalOpen(true)}
        onSelect={setSelected}
      />
      {businessId && (
        <NuevaSlot
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          fecha={fecha}
          businessId={businessId}
          navigate={navigate}
        />
      )}
      <DetailSlot
        selected={selected}
        setSelected={setSelected}
        handleShare={handleShare}
        eliminar={eliminar}
      />
    </DesktopAppShellWrapper>
  );
}
