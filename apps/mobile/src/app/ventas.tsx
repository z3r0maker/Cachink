/**
 * Expo Router entry for /ventas (P1C-M3, S4-C1 route wire-up).
 *
 * Thin wrapper: wires `useVentasByDate` to `VentasScreen` inside the
 * shared AppShell. The Nueva Venta modal + VentaDetailPopover ship
 * already in @cachink/ui — route toggles visibility via local state.
 *
 * Audit Round 2 K1 added swipe-to-edit + swipe-to-delete plumbing;
 * the slot wrappers live in `../shell/ventas-slots.tsx` so this file
 * stays under the §4.4 200-line cap.
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
import {
  CorteHomeCard,
  VentasScreen,
  totalDelDia,
  useCurrentBusiness,
  useCurrentBusinessId,
  useEliminarVenta,
  useRole,
  useVentasByDate,
} from '@cachink/ui';
import type { IsoDate, Sale } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';
import { useSwipeState } from '../shell/use-swipe-state';
import { DetailSlot, NuevaSlot, SwipeSlots, useShareComprobante } from '../shell/ventas-slots';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

interface ScreenSlotProps {
  fecha: IsoDate;
  onChangeFecha: (next: IsoDate) => void;
  onOpen: () => void;
  onSelect: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onConfirmDelete: (sale: Sale) => void;
}

function ScreenSlot(props: ScreenSlotProps): ReactElement {
  const ventasQ = useVentasByDate(props.fecha);
  return (
    <VentasScreen
      fecha={props.fecha}
      onChangeFecha={(next) => props.onChangeFecha(next as IsoDate)}
      ventas={ventasQ.data ?? []}
      total={totalDelDia(ventasQ.data ?? [])}
      onNuevaVenta={props.onOpen}
      onVentaPress={props.onSelect}
      onEditVenta={props.onEdit}
      onEliminarVenta={props.onConfirmDelete}
      loading={ventasQ.isLoading}
      error={ventasQ.error as Error | null}
      onRetry={() => void ventasQ.refetch()}
    />
  );
}

function useVentasRouteState() {
  const router = useRouter();
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Sale | null>(null);
  const swipe = useSwipeState<Sale>();
  const businessId = useCurrentBusinessId();
  const business = useCurrentBusiness().data ?? null;
  const eliminar = useEliminarVenta();
  const role = useRole();
  const handleShare = useShareComprobante(selected, business, () => setSelected(null));
  return {
    router,
    fecha,
    setFecha,
    modalOpen,
    setModalOpen,
    selected,
    setSelected,
    swipe,
    businessId,
    business,
    eliminar,
    role,
    handleShare,
  };
}

export default function VentasRoute(): ReactElement {
  const s = useVentasRouteState();
  return (
    <AppShellWrapper activeTabKey="ventas">
      {s.role === 'operativo' && <CorteHomeCard testID="corte-home-card-ventas" />}
      <ScreenSlot
        fecha={s.fecha}
        onChangeFecha={s.setFecha}
        onOpen={() => s.setModalOpen(true)}
        onSelect={s.setSelected}
        onEdit={s.swipe.setEditing}
        onConfirmDelete={s.swipe.setConfirmDelete}
      />
      {s.businessId && (
        <NuevaSlot
          open={s.modalOpen}
          onClose={() => s.setModalOpen(false)}
          fecha={s.fecha}
          businessId={s.businessId}
          router={s.router}
        />
      )}
      <DetailSlot
        selected={s.selected}
        setSelected={s.setSelected}
        handleShare={s.handleShare}
        eliminar={s.eliminar}
      />
      <SwipeSlots
        editing={s.swipe.editing}
        setEditing={s.swipe.setEditing}
        confirmDelete={s.swipe.confirmDelete}
        setConfirmDelete={s.swipe.setConfirmDelete}
        eliminar={s.eliminar}
      />
    </AppShellWrapper>
  );
}
