/**
 * Expo Router entry for /egresos (P1C-M4, S4-C1 route wire-up).
 */

import { useState, type ReactElement } from 'react';
import {
  EgresoDetailPopover,
  EgresosScreen,
  NuevoEgresoModalSmart,
  PendientesCard,
  totalEgresosDelDia,
  useEgresosByDate,
  useEliminarEgreso,
  usePendientesGastosRecurrentes,
  useProcesarGastoRecurrente,
} from '@cachink/ui';
import type { Expense, IsoDate } from '@cachink/domain';
import { AppShellWrapper } from '../shell/app-shell-wrapper';
import { useSwipeState } from '../shell/use-swipe-state';
import { EgresoSwipeSlots } from '../shell/egresos-slots';

function todayIso(): IsoDate {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}` as IsoDate;
}

function PendientesSlot({ fecha }: { fecha: IsoDate }): ReactElement {
  const pendientesQ = usePendientesGastosRecurrentes(fecha);
  const procesar = useProcesarGastoRecurrente();
  return (
    <PendientesCard
      pendientes={pendientesQ.data ?? []}
      onConfirmar={(p) => procesar.mutate({ template: p, today: fecha })}
      confirming={procesar.isPending}
    />
  );
}

interface EgresosSlotProps {
  fecha: IsoDate;
  onChangeFecha: (next: IsoDate) => void;
  onOpen: () => void;
  onSelect: (egreso: Expense) => void;
  onEdit: (egreso: Expense) => void;
  onConfirmDelete: (egreso: Expense) => void;
}

function EgresosSlot(props: EgresosSlotProps): ReactElement {
  const egresosQ = useEgresosByDate(props.fecha);
  return (
    <EgresosScreen
      fecha={props.fecha}
      onChangeFecha={(next) => props.onChangeFecha(next as IsoDate)}
      egresos={egresosQ.data ?? []}
      total={totalEgresosDelDia(egresosQ.data ?? [])}
      onNuevoEgreso={props.onOpen}
      onEgresoPress={props.onSelect}
      onEditEgreso={props.onEdit}
      onEliminarEgreso={props.onConfirmDelete}
      loading={egresosQ.isLoading}
      error={egresosQ.error as Error | null}
      onRetry={() => void egresosQ.refetch()}
    />
  );
}

function DetailPopoverSlot({
  selected,
  setSelected,
  eliminar,
}: {
  selected: Expense | null;
  setSelected: (e: Expense | null) => void;
  eliminar: ReturnType<typeof useEliminarEgreso>;
}): ReactElement {
  return (
    <EgresoDetailPopover
      open={selected !== null}
      egreso={selected}
      onClose={() => setSelected(null)}
      onDelete={() => {
        if (selected) {
          eliminar.mutate({ id: selected.id, fecha: selected.fecha });
          setSelected(null);
        }
      }}
      deleting={eliminar.isPending}
    />
  );
}

export default function EgresosRoute(): ReactElement {
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const swipe = useSwipeState<Expense>();
  const eliminar = useEliminarEgreso();

  return (
    <AppShellWrapper activeTabKey="egresos">
      <PendientesSlot fecha={fecha} />
      <EgresosSlot
        fecha={fecha}
        onChangeFecha={setFecha}
        onOpen={() => setModalOpen(true)}
        onSelect={setSelected}
        onEdit={swipe.setEditing}
        onConfirmDelete={swipe.setConfirmDelete}
      />
      <NuevoEgresoModalSmart open={modalOpen} onClose={() => setModalOpen(false)} fecha={fecha} />
      <DetailPopoverSlot selected={selected} setSelected={setSelected} eliminar={eliminar} />
      <EgresoSwipeSlots
        editing={swipe.editing}
        setEditing={swipe.setEditing}
        confirmDelete={swipe.confirmDelete}
        setConfirmDelete={swipe.setConfirmDelete}
        eliminar={eliminar}
      />
    </AppShellWrapper>
  );
}
