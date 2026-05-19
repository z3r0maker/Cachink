/**
 * CajaContent — orchestrator for the cash-drawer screen.
 *
 * State machine (Caja Overhaul):
 *   turno == null                        → AbrirCaja (numpad)
 *   turno.cierreAt == null &&
 *     turno.conteoCentavos == null        → Active turn (balance, deposit/withdraw)
 *   turno.cierreAt == null &&
 *     turno.conteoCentavos != null        → Step 2 (comparison + close form)
 *   turno.cierreAt != null               → Closed (new turn needed)
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import type {
  CajaMovimientoTipo,
  CajaTurno,
  Money,
  UserId,
} from '@cachink/domain';
import { CajaActiveTurnView } from './caja-active-turn';
import { CajaOpenTurnView } from './caja-open-turn-view';
import { MovimientoSheetWired } from './movimiento-sheet-wired';
import { CerrarCajaModal } from './cerrar-caja-modal';
import { useCerrarCaja } from '../../hooks/use-cerrar-caja';
import { useOpenCajaTurno } from '../../hooks/use-open-caja-turno';

export interface CajaContentProps {
  readonly testID?: string;
}

function hasBlindCountPending(turno: CajaTurno | null): boolean {
  if (turno === null || turno.cierreAt !== null) return false;
  return (turno as CajaTurno & { conteoCentavos?: Money | null }).conteoCentavos != null;
}

export function CajaContent(_props: CajaContentProps): ReactElement {
  const { userId, openTurno } = useOpenCajaTurno();
  const cerrar = useCerrarCaja();
  const [showCerrar, setShowCerrar] = useState(false);
  const [movSheet, setMovSheet] = useState<CajaMovimientoTipo | null>(null);

  const shouldShowCerrar = showCerrar || hasBlindCountPending(openTurno);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {openTurno === null && !shouldShowCerrar && (
        <CajaOpenTurnView userId={userId as UserId | null} />
      )}
      {openTurno !== null && !shouldShowCerrar && (
        <CajaActiveTurnView
          turno={openTurno}
          onCerrar={() => setShowCerrar(true)}
          onDeposit={() => setMovSheet('deposito')}
          onWithdraw={() => setMovSheet('retiro')}
        />
      )}
      <CajaCloseSection
        shouldShow={shouldShowCerrar}
        openTurno={openTurno}
        cerrar={cerrar}
        onClose={() => setShowCerrar(false)}
      />
      {movSheet !== null && openTurno !== null && userId !== null && (
        <MovimientoSheetWired
          tipo={movSheet}
          turnoId={openTurno.id}
          userId={userId}
          onClose={() => setMovSheet(null)}
        />
      )}
    </ScrollView>
  );
}

function CajaCloseSection(props: {
  shouldShow: boolean;
  openTurno: CajaTurno | null;
  cerrar: ReturnType<typeof useCerrarCaja>;
  onClose: () => void;
}): ReactElement | null {
  if (!props.shouldShow || props.openTurno === null) return null;

  return (
    <CerrarCajaModal
      onSubmit={(monto, reason, explicacion) => {
        props.cerrar.mutate(
          {
            turnoId: props.openTurno!.id,
            montoCierreCentavos: monto,
            discrepancyReason: reason,
            explicacion,
          },
          { onSuccess: props.onClose },
        );
      }}
      submitting={props.cerrar.isPending}
    />
  );
}
