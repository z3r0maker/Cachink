/**
 * CajaOpenTurnView — opening sub-view with discrepancy check + handoff.
 *
 * Extracted from caja-content.tsx for the 40-line-per-function rule.
 */

import { useState, type ReactElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessId, Money, UserId } from '@cachink/domain';
import { ZERO } from '@cachink/domain';
import { AbrirCajaModal } from './abrir-caja-modal';
import { OpeningDiscrepancyDialog } from './opening-discrepancy-dialog';
import { CajaHandoffBanner } from './caja-handoff-banner';
import { useAbrirCaja } from '../../hooks/use-abrir-caja';
import { useCajaTurnosRepository } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';
import { useOtherOpenTurno } from './use-other-open-turno';

export interface CajaOpenTurnViewProps {
  readonly userId: UserId | null;
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

function exceedsDiscrepancy(amount: Money, reference: Money): boolean {
  const diff = amount - reference;
  const absDiff = diff < 0n ? -diff : diff;
  return absDiff > DISCREPANCY_TOLERANCE;
}

function shouldShowDiscrepancy(pending: Money | null, prev: Money | null): boolean {
  return pending !== null && prev !== null && exceedsDiscrepancy(pending, prev);
}

export function CajaOpenTurnView(props: CajaOpenTurnViewProps): ReactElement {
  const previousClose = usePreviousClose();
  const abrir = useAbrirCaja();
  const { otherTurno, otherUserName } = useOtherOpenTurno(props.userId);
  const [pendingAmount, setPendingAmount] = useState<Money | null>(null);
  const [skipHandoff, setSkipHandoff] = useState(false);

  if (otherTurno && otherUserName && !skipHandoff) {
    return (
      <HandoffView
        userId={props.userId}
        abrir={abrir}
        otherUserName={otherUserName}
        openingAmount={otherTurno.montoAperturaCentavos}
        onDifferent={() => setSkipHandoff(true)}
      />
    );
  }

  if (shouldShowDiscrepancy(pendingAmount, previousClose)) {
    return (
      <DiscrepancyView
        userId={props.userId}
        abrir={abrir}
        previousClose={previousClose!}
        pendingAmount={pendingAmount!}
        onGoBack={() => setPendingAmount(null)}
      />
    );
  }

  return (
    <AbrirCajaModal
      suggestedAmount={previousClose}
      previousCloseAmount={previousClose}
      onSubmit={(apertura) => {
        handleApertura(apertura, previousClose, setPendingAmount, props.userId, abrir);
      }}
      submitting={abrir.isPending}
    />
  );
}

function handleApertura(
  apertura: Money,
  previousClose: Money | null,
  setPendingAmount: (v: Money | null) => void,
  userId: UserId | null,
  abrir: ReturnType<typeof useAbrirCaja>,
): void {
  if (previousClose !== null && exceedsDiscrepancy(apertura, previousClose)) {
    setPendingAmount(apertura);
    return;
  }
  if (!userId) return;
  abrir.mutate({
    userId,
    montoAperturaCentavos: apertura,
    efectivoAdicionalCentavos: ZERO,
  });
}

function HandoffView(props: {
  userId: UserId | null;
  abrir: ReturnType<typeof useAbrirCaja>;
  otherUserName: string;
  openingAmount: Money;
  onDifferent: () => void;
}): ReactElement {
  return (
    <CajaHandoffBanner
      otherUserName={props.otherUserName}
      openingAmount={props.openingAmount}
      onConfirm={() => {
        if (!props.userId) return;
        props.abrir.mutate({
          userId: props.userId,
          montoAperturaCentavos: props.openingAmount,
          efectivoAdicionalCentavos: ZERO,
        });
      }}
      onDifferent={props.onDifferent}
      submitting={props.abrir.isPending}
    />
  );
}

function DiscrepancyView(props: {
  userId: UserId | null;
  abrir: ReturnType<typeof useAbrirCaja>;
  previousClose: Money;
  pendingAmount: Money;
  onGoBack: () => void;
}): ReactElement {
  const diff = props.pendingAmount - props.previousClose;
  return (
    <OpeningDiscrepancyDialog
      previousClose={props.previousClose}
      newOpening={props.pendingAmount}
      difference={diff}
      onGoBack={props.onGoBack}
      onContinue={() => {
        if (!props.userId) return;
        props.abrir.mutate({
          userId: props.userId,
          montoAperturaCentavos: props.pendingAmount,
          efectivoAdicionalCentavos: ZERO,
        });
      }}
      submitting={props.abrir.isPending}
    />
  );
}
