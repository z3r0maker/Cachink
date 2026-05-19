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
 * Caja Overhaul — Phase C.
 */

import { useState, type ReactElement } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CajaTurno, DiscrepancyReason, Money } from '@cachink/domain';
import { now } from '@cachink/domain';
import type { BusinessId } from '@cachink/domain';
import { useQuery } from '@tanstack/react-query';
import { BlindCountStep } from './blind-count-step';
import { CountResultStep } from './count-result-step';
import { useExpectedCash } from './use-expected-cash';
import { useCajaTurnosRepository } from '../../app/repository-provider';
import { useCurrentBusinessId } from '../../app-config/use-app-config';

export interface CerrarCajaModalProps {
  readonly onSubmit: (
    montoCierre: Money,
    reason: DiscrepancyReason | null,
    explicacion: string | null,
  ) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

function extractExistingConteo(turno: CajaTurno | null): Money | null {
  if (!turno) return null;
  return (turno as CajaTurno & { conteoCentavos?: Money | null }).conteoCentavos ?? null;
}

function useCerrarCajaState() {
  const turnosRepo = useCajaTurnosRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const [savedConteo, setSavedConteo] = useState<Money | null>(null);
  const [savingConteo, setSavingConteo] = useState(false);
  const openQ = useQuery({
    queryKey: ['cerrar-open-turno', businessId],
    queryFn: async () => (businessId ? turnosRepo.findLatest(businessId as BusinessId) : null),
    enabled: !!businessId,
  });
  const turno = openQ.data ?? null;
  const esperado = useExpectedCash(turno);
  const conteo = savedConteo ?? extractExistingConteo(turno);
  const handleBlindSubmit = async (c: Money) =>
    saveBlindCount(turno, c, turnosRepo, queryClient, setSavingConteo, setSavedConteo);
  return { conteo, esperado, turno, savingConteo, handleBlindSubmit };
}

export function CerrarCajaModal(props: CerrarCajaModalProps): ReactElement {
  const { conteo, esperado, savingConteo, handleBlindSubmit } = useCerrarCajaState();
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
  turno: CajaTurno | null,
  conteoCentavos: Money,
  turnosRepo: ReturnType<typeof useCajaTurnosRepository>,
  queryClient: ReturnType<typeof useQueryClient>,
  setSavingConteo: (v: boolean) => void,
  setSavedConteo: (v: Money | null) => void,
): Promise<void> {
  if (!turno) return;
  setSavingConteo(true);
  try {
    await turnosRepo.update(turno.id, {
      conteoCentavos,
      conteoAt: now(),
    });
    await queryClient.invalidateQueries({ queryKey: ['cerrar-open-turno'] });
    setSavedConteo(conteoCentavos);
  } finally {
    setSavingConteo(false);
  }
}
