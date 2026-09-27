/**
 * Expo Router entry for /egresos («Gastos», P1C-M4, S4-C1 route wire-up).
 *
 * The persistent `(tabs)/_layout.tsx` provides the AppShell; this file
 * renders ONLY the content area + overlays. The register records gastos and
 * the recurring ones due today; editing or deleting them is the owner's job
 * in the portal.
 */

import { useState, type ReactElement } from 'react';
import {
  EgresosScreen,
  NuevoEgresoModalSmart,
  PendientesCard,
  totalEgresosDelDia,
  useEgresosByDate,
  usePendientesGastosRecurrentes,
  useProcesarGastoRecurrente,
  useDescartarGastoRecurrente,
} from '@xangarro/ui';
import type { IsoDate } from '@xangarro/domain';

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

interface EgresosSlotProps {
  fecha: IsoDate;
  onChangeFecha: (next: IsoDate) => void;
  onOpen: () => void;
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
      loading={egresosQ.isLoading}
      error={egresosQ.error as Error | null}
      onRetry={() => void egresosQ.refetch()}
    />
  );
}

export default function EgresosRoute(): ReactElement {
  const [fecha, setFecha] = useState<IsoDate>(todayIso);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <PendientesSlot fecha={fecha} />
      <EgresosSlot fecha={fecha} onChangeFecha={setFecha} onOpen={() => setModalOpen(true)} />
      <NuevoEgresoModalSmart open={modalOpen} onClose={() => setModalOpen(false)} fecha={fecha} />
    </>
  );
}
