/**
 * Expo Router entry for /gastos — standalone Gastos screen accessed
 * from the Otros grid. Wraps the same Egresos content in AppShellWrapper
 * so it gets a back button + bottom tab bar.
 *
 * The tab route `(tabs)/egresos.tsx` renders the same content inside
 * the tab layout (no AppShellWrapper needed there).
 */

import { useState, type ReactElement } from 'react';
import { useRouter } from 'expo-router';
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
  useDescartarGastoRecurrente,
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
  const descartar = useDescartarGastoRecurrente();
  return (
    <PendientesCard
      pendientes={pendientesQ.data ?? []}
      onConfirmar={(p) => procesar.mutate({ template: p, today: fecha })}
      onDescartar={(p) => descartar.mutate({ template: p, today: fecha })}
      confirming={procesar.isPending}
    />
  );
}

interface EgresoOverlaysProps {
  modalOpen: boolean;
  onCloseModal: () => void;
  fecha: IsoDate;
  selected: Expense | null;
  onCloseDetail: () => void;
  eliminar: ReturnType<typeof useEliminarEgreso>;
  swipe: ReturnType<typeof useSwipeState<Expense>>;
}

function EgresoOverlays(props: EgresoOverlaysProps): ReactElement {
  const { modalOpen, onCloseModal, fecha, selected, onCloseDetail, eliminar, swipe } = props;
  return (
    <>
      <NuevoEgresoModalSmart open={modalOpen} onClose={onCloseModal} fecha={fecha} />
      <EgresoDetailPopover
        open={selected !== null}
        egreso={selected}
        onClose={onCloseDetail}
        onDelete={() => {
          if (selected) {
            eliminar.mutate({ id: selected.id, fecha: selected.fecha });
            onCloseDetail();
          }
        }}
        deleting={eliminar.isPending}
      />
      <EgresoSwipeSlots
        editing={swipe.editing}
        setEditing={swipe.setEditing}
        confirmDelete={swipe.confirmDelete}
        setConfirmDelete={swipe.setConfirmDelete}
        eliminar={eliminar}
      />
    </>
  );
}

export default function GastosRoute(): ReactElement {
  const router = useRouter();
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const swipe = useSwipeState<Expense>();
  const eliminar = useEliminarEgreso();
  const egresosQ = useEgresosByDate(fecha);

  return (
    <AppShellWrapper activeTabKey="otros" onBack={() => router.back()}>
      <PendientesSlot fecha={fecha} />
      <EgresosScreen
        fecha={fecha}
        onChangeFecha={(next) => setFecha(next as IsoDate)}
        egresos={egresosQ.data ?? []}
        total={totalEgresosDelDia(egresosQ.data ?? [])}
        onNuevoEgreso={() => setModalOpen(true)}
        onEgresoPress={setSelected}
        onEditEgreso={swipe.setEditing}
        onEliminarEgreso={swipe.setConfirmDelete}
        loading={egresosQ.isLoading}
        error={egresosQ.error as Error | null}
        onRetry={() => void egresosQ.refetch()}
      />
      <EgresoOverlays
        modalOpen={modalOpen}
        onCloseModal={() => setModalOpen(false)}
        fecha={fecha}
        selected={selected}
        onCloseDetail={() => setSelected(null)}
        eliminar={eliminar}
        swipe={swipe}
      />
    </AppShellWrapper>
  );
}
