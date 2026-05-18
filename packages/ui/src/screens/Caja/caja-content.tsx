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
import { useQuery } from '@tanstack/react-query';
import type {
  BusinessId,
  CajaMovimientoTipo,
  CajaTurno,
  Money,
  UserId,
} from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import { AbrirCajaModal } from './abrir-caja-modal';
import { OpeningDiscrepancyDialog } from './opening-discrepancy-dialog';
import { CajaActiveTurnView } from './caja-active-turn';
import { CajaHandoffBanner } from './caja-handoff-banner';
import { MovimientoSheetWired } from './movimiento-sheet-wired';
import { CerrarCajaModal } from './cerrar-caja-modal';
import { useAbrirCaja } from '../../hooks/use-abrir-caja';
import { useCerrarCaja } from '../../hooks/use-cerrar-caja';
import { useOpenCajaTurno } from '../../hooks/use-open-caja-turno';
import { useCajaTurnosRepository } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { useOtherOpenTurno } from './use-other-open-turno';

export interface CajaContentProps {
  readonly testID?: string;
}

/** Tolerance for discrepancy check — $50 MXN = 5000 centavos. */
const DISCREPANCY_TOLERANCE = 5000n;

function usePreviousClose(): Money | null {
  const businessId = useCurrentBusinessId();
  const turnosRepo = useCajaTurnosRepository();
  const latestQ = useQuery({
    queryKey: ['caja-previous-close', businessId],
    queryFn: () =>
      businessId ? turnosRepo.findLatest(businessId as BusinessId) : null,
    enabled: businessId !== null,
  });
  return latestQ.data?.montoCierreCentavos ?? null;
}

export function CajaContent(_props: CajaContentProps): ReactElement {
  const { userId, openTurno } = useOpenCajaTurno();
  const abrir = useAbrirCaja();
  const cerrar = useCerrarCaja();
  const [showCerrar, setShowCerrar] = useState(false);
  const [movSheet, setMovSheet] = useState<CajaMovimientoTipo | null>(null);

  // Blind close recovery: if turno has conteoCentavos but no cierreAt,
  // jump straight to the close flow (Step 2)
  const hasBlindCount =
    openTurno !== null &&
    openTurno.cierreAt === null &&
    (openTurno as CajaTurno & { conteoCentavos?: Money | null }).conteoCentavos != null;

  const shouldShowCerrar = showCerrar || hasBlindCount;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {openTurno === null && !shouldShowCerrar && (
        <CajaOpenTurnView userId={userId as UserId | null} abrir={abrir} />
      )}
      {openTurno !== null && !shouldShowCerrar && (
        <CajaActiveTurnView
          turno={openTurno}
          onCerrar={() => setShowCerrar(true)}
          onDeposit={() => setMovSheet('deposito')}
          onWithdraw={() => setMovSheet('retiro')}
        />
      )}
      {shouldShowCerrar && openTurno !== null && (
        <CerrarCajaModal
          onSubmit={(monto, reason, explicacion) => {
            cerrar.mutate(
              {
                turnoId: openTurno.id,
                montoCierreCentavos: monto,
                discrepancyReason: reason,
                explicacion,
              },
              { onSuccess: () => setShowCerrar(false) },
            );
          }}
          submitting={cerrar.isPending}
        />
      )}
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

// --- Opening sub-view with discrepancy check + handoff ---

interface CajaOpenTurnViewProps {
  readonly userId: UserId | null;
  readonly abrir: ReturnType<typeof useAbrirCaja>;
}

function CajaOpenTurnView(props: CajaOpenTurnViewProps): ReactElement {
  const previousClose = usePreviousClose();
  const { otherTurno, otherUserName } = useOtherOpenTurno(props.userId);
  const [pendingAmount, setPendingAmount] = useState<Money | null>(null);
  const [skipHandoff, setSkipHandoff] = useState(false);

  // Show handoff banner if another user has an open turn
  if (otherTurno && otherUserName && !skipHandoff) {
    return (
      <CajaHandoffBanner
        otherUserName={otherUserName}
        openingAmount={otherTurno.montoAperturaCentavos}
        onConfirm={() => {
          if (!props.userId) return;
          props.abrir.mutate({
            userId: props.userId,
            montoAperturaCentavos: otherTurno.montoAperturaCentavos,
            efectivoAdicionalCentavos: ZERO,
          });
        }}
        onDifferent={() => setSkipHandoff(true)}
        submitting={props.abrir.isPending}
      />
    );
  }

  if (pendingAmount !== null && previousClose !== null) {
    const diff = pendingAmount - previousClose;
    const absDiff = diff < 0n ? -diff : diff;
    if (absDiff > DISCREPANCY_TOLERANCE) {
      return (
        <OpeningDiscrepancyDialog
          previousClose={previousClose}
          newOpening={pendingAmount}
          difference={diff}
          onGoBack={() => setPendingAmount(null)}
          onContinue={() => {
            if (!props.userId) return;
            props.abrir.mutate({
              userId: props.userId,
              montoAperturaCentavos: pendingAmount,
              efectivoAdicionalCentavos: ZERO,
            });
          }}
          submitting={props.abrir.isPending}
        />
      );
    }
  }

  return (
    <AbrirCajaModal
      suggestedAmount={previousClose}
      previousCloseAmount={previousClose}
      onSubmit={(apertura) => {
        if (previousClose !== null) {
          const diff = apertura - previousClose;
          const absDiff = diff < 0n ? -diff : diff;
          if (absDiff > DISCREPANCY_TOLERANCE) {
            setPendingAmount(apertura);
            return;
          }
        }
        if (!props.userId) return;
        props.abrir.mutate({
          userId: props.userId,
          montoAperturaCentavos: apertura,
          efectivoAdicionalCentavos: ZERO,
        });
      }}
      submitting={props.abrir.isPending}
    />
  );
}
