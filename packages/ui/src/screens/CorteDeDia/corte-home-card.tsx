/**
 * CorteHomeCard — smart wrapper composing CorteDeDiaCard +
 * CorteDeDiaModal + useCorteGate + useEfectivoEsperado +
 * useCerrarCorteDeDia (Slice 9.6 T09).
 *
 * Renders nothing until:
 *   - Current time is past the 18:00 gate (useCorteGate), AND
 *   - No corte has already been closed today (useCorteDelDia), AND
 *   - A business + device are selected (repositories need them).
 *
 * Mobile's Operativo home is the VentasScreen; this component slots
 * into either the Director home (DirectorHomeRoute) OR above the
 * Ventas list for Operativo. Routes decide which.
 */

import { useState, type ReactElement } from 'react';
import type { BusinessId, IsoDate } from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import { CorteDeDiaCard } from './corte-card';
import { CorteDeDiaModal } from './corte-modal';
import { useCorteGate } from '../../hooks/use-corte-gate';
import { useCorteDelDia } from '../../hooks/use-corte-del-dia';
import { useEfectivoEsperado } from '../../hooks/use-efectivo-esperado';
import { useCerrarCorteDeDia } from '../../hooks/use-cerrar-corte-de-dia';
import { useCurrentBusinessId, useDeviceId, useRole } from '../../app-config/index';

function todayIso(): IsoDate {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}` as IsoDate;
}

export interface CorteHomeCardProps {
  readonly testID?: string;
}

interface ModalSlotProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly esperado: ReturnType<typeof useEfectivoEsperado>['data'] extends infer T
    ? T extends { esperado: infer M }
      ? M
      : never
    : never;
  readonly onSubmit: (payload: { efectivoContadoCentavos: bigint; explicacion?: string }) => void;
  readonly submitting: boolean;
}

function ModalSlot(p: ModalSlotProps): ReactElement {
  return (
    <CorteDeDiaModal
      open={p.open}
      onClose={p.onClose}
      esperado={p.esperado as never}
      onSubmit={(payload) =>
        p.onSubmit({
          efectivoContadoCentavos: payload.efectivoContadoCentavos as unknown as bigint,
          explicacion: payload.explicacion,
        })
      }
      submitting={p.submitting}
    />
  );
}

function useSubmitHandler(
  fecha: ReturnType<typeof todayIso>,
  setOpen: (v: boolean) => void,
): (payload: { efectivoContadoCentavos: bigint; explicacion?: string }) => void {
  const businessId = useCurrentBusinessId();
  const deviceId = useDeviceId();
  const role = useRole();
  const cerrar = useCerrarCorteDeDia();
  return (payload) => {
    if (!businessId || !deviceId) return;
    cerrar.mutate(
      {
        fecha,
        businessId: businessId as BusinessId,
        deviceId: deviceId as string,
        efectivoContadoCentavos: payload.efectivoContadoCentavos as never,
        explicacion: payload.explicacion,
        cerradoPor: role === 'director' ? 'Director' : 'Operativo',
      },
      { onSuccess: () => setOpen(false) },
    );
  };
}

export function CorteHomeCard(props: CorteHomeCardProps): ReactElement | null {
  const [open, setOpen] = useState(false);
  const fecha = todayIso();
  const businessId = useCurrentBusinessId();
  const deviceId = useDeviceId();
  const gate = useCorteGate();
  const corteQ = useCorteDelDia({ fecha });
  const esperadoQ = useEfectivoEsperado({ fecha });
  const cerrar = useCerrarCorteDeDia();
  const handleSubmit = useSubmitHandler(fecha, setOpen);
  const shouldShow =
    gate.shouldShow && corteQ.data === null && businessId !== null && deviceId !== null;
  return (
    <>
      <CorteDeDiaCard
        shouldShow={shouldShow}
        onOpen={() => setOpen(true)}
        testID={props.testID ?? 'corte-home-card'}
      />
      <ModalSlot
        open={open}
        onClose={() => setOpen(false)}
        esperado={esperadoQ.data?.esperado ?? ZERO}
        onSubmit={handleSubmit}
        submitting={cerrar.isPending}
      />
    </>
  );
}
