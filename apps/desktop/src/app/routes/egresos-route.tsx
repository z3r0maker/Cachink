/**
 * Desktop route adapter for /egresos. Mirrors
 * `apps/mobile/src/app/egresos.tsx`. App-shell only per CLAUDE.md §5.6.
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
import { DesktopAppShellWrapper } from '../../shell/desktop-app-shell-wrapper';

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

function EgresosSlot(props: {
  fecha: IsoDate;
  onChangeFecha: (next: IsoDate) => void;
  onOpen: () => void;
  onSelect: (egreso: Expense) => void;
}): ReactElement {
  const egresosQ = useEgresosByDate(props.fecha);
  return (
    <EgresosScreen
      fecha={props.fecha}
      onChangeFecha={(next) => props.onChangeFecha(next as IsoDate)}
      egresos={egresosQ.data ?? []}
      total={totalEgresosDelDia(egresosQ.data ?? [])}
      onNuevoEgreso={props.onOpen}
      onEgresoPress={props.onSelect}
      loading={egresosQ.isLoading}
      error={egresosQ.error as Error | null}
      onRetry={() => void egresosQ.refetch()}
    />
  );
}

export function EgresosRoute(): ReactElement {
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Expense | null>(null);
  const eliminar = useEliminarEgreso();

  return (
    <DesktopAppShellWrapper activeTabKey="egresos">
      <PendientesSlot fecha={fecha} />
      <EgresosSlot
        fecha={fecha}
        onChangeFecha={setFecha}
        onOpen={() => setModalOpen(true)}
        onSelect={setSelected}
      />
      <NuevoEgresoModalSmart open={modalOpen} onClose={() => setModalOpen(false)} fecha={fecha} />
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
    </DesktopAppShellWrapper>
  );
}
