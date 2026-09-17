/**
 * CerrarCajaModal — 2-step tamper-proof blind-close orchestrator.
 *
 * Step 1 (BlindCountStep): operator enters count without seeing expected.
 *   → Immediately saves `conteoCentavos` + `conteoAt` to DB.
 * Step 2 (CountResultStep): comparison + reason + close.
 *
 * If the app is killed after Step 1, CajaContent detects
 * `conteoCentavos != null` and jumps directly to Step 2.
 *
 * Works on the `turno` CajaContent passes in (its open-turno query). It used
 * to look the turno up through a query of its own that nothing refreshed on
 * open/close, so a new turno inherited the previous turno's locked count.
 *
 * Caja Overhaul — Phase C.
 */

import { useState, type ReactElement } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CajaTurno, DiscrepancyReason, Money } from '@xangarro/domain';
import { now } from '@xangarro/domain';
import { BlindCountStep } from './blind-count-step';
import { CountResultStep } from './count-result-step';
import { useExpectedCash } from './use-expected-cash';
import { useCajaTurnosRepository } from '../../app/repository-provider';
import { cajaKeys } from '../../hooks/query-keys';

export interface CerrarCajaModalProps {
  /** The open turno being closed. */
  readonly turno: CajaTurno;
  readonly onSubmit: (
    montoCierre: Money,
    reason: DiscrepancyReason | null,
    explicacion: string | null,
  ) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

function extractExistingConteo(turno: CajaTurno): Money | null {
  return (turno as CajaTurno & { conteoCentavos?: Money | null }).conteoCentavos ?? null;
}

function useCerrarCajaState(turno: CajaTurno) {
  const turnosRepo = useCajaTurnosRepository();
  const queryClient = useQueryClient();
  // Keyed by turno so a count saved for one turno never leaks into the next.
  const [saved, setSaved] = useState<{ turnoId: string; conteo: Money } | null>(null);
  const [savingConteo, setSavingConteo] = useState(false);
  const esperado = useExpectedCash(turno);
  const savedConteo = saved?.turnoId === turno.id ? saved.conteo : null;
  const conteo = savedConteo ?? extractExistingConteo(turno);
  const handleBlindSubmit = async (c: Money) =>
    saveBlindCount(turno, c, turnosRepo, queryClient, setSavingConteo, (v) =>
      setSaved({ turnoId: turno.id, conteo: v }),
    );
  return { conteo, esperado, savingConteo, handleBlindSubmit };
}

export function CerrarCajaModal(props: CerrarCajaModalProps): ReactElement {
  const { conteo, esperado, savingConteo, handleBlindSubmit } = useCerrarCajaState(props.turno);
  if (conteo !== null) {
    return (
      <CountResultStep
        conteoCentavos={conteo}
        esperadoCentavos={esperado}
        onClose={(reason, explicacion) => props.onSubmit(conteo, reason, explicacion)}
        submitting={props.submitting}
        testID="cerrar-caja-step-2"
      />
    );
  }
  return (
    <BlindCountStep
      onSubmit={handleBlindSubmit}
      submitting={savingConteo}
      testID="cerrar-caja-step-1"
    />
  );
}

async function saveBlindCount(
  turno: CajaTurno,
  conteoCentavos: Money,
  turnosRepo: ReturnType<typeof useCajaTurnosRepository>,
  queryClient: ReturnType<typeof useQueryClient>,
  setSavingConteo: (v: boolean) => void,
  setSavedConteo: (v: Money) => void,
): Promise<void> {
  setSavingConteo(true);
  try {
    await turnosRepo.update(turno.id, {
      conteoCentavos,
      conteoAt: now(),
    });
    // CajaContent's open-turno query carries the count across an app restart.
    await queryClient.invalidateQueries({ queryKey: cajaKeys.openByUser(turno.businessId) });
    setSavedConteo(conteoCentavos);
  } finally {
    setSavingConteo(false);
  }
}
