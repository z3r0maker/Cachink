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
import { computeCajaBalance, now, ZERO } from '@cachink/domain';
import type { BusinessId } from '@cachink/domain';
import { useQuery } from '@tanstack/react-query';
import { BlindCountStep } from './blind-count-step';
import { CountResultStep } from './count-result-step';
import { useCajaTurnosRepository, useSalesRepository, useExpensesRepository,
  useCajaMovimientosRepository } from '../../app/repository-provider';
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

function useExpectedCash(turno: CajaTurno | null): Money {
  const businessId = useCurrentBusinessId() as BusinessId | null;
  const salesRepo = useSalesRepository();
  const expensesRepo = useExpensesRepository();
  const movRepo = useCajaMovimientosRepository();
  const fecha = turno?.fecha ?? '';

  const salesQ = useQuery({
    queryKey: ['cerrar-sales', turno?.id],
    queryFn: () =>
      businessId && turno ? salesRepo.findByDateRange(fecha, fecha, businessId) : [],
    enabled: !!turno && !!businessId,
  });
  const expensesQ = useQuery({
    queryKey: ['cerrar-expenses', turno?.id],
    queryFn: () =>
      businessId && turno ? expensesRepo.findByDateRange(fecha, fecha, businessId) : [],
    enabled: !!turno && !!businessId,
  });
  const movQ = useQuery({
    queryKey: ['cerrar-movimientos', turno?.id],
    queryFn: () => turno ? movRepo.findByTurno(turno.id) : [],
    enabled: !!turno,
  });

  if (!turno) return ZERO;
  const sales = salesQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const movimientos = movQ.data ?? [];
  const cashSales = sales.filter((s) => s.metodo === 'Efectivo' && !s.cancelledAt);

  const balance = computeCajaBalance({
    aperturaCentavos: turno.montoAperturaCentavos,
    adicionalCentavos: turno.efectivoAdicionalCentavos,
    ventasEfectivoCentavos: cashSales.map((s) => s.monto),
    efectivoRecibidoPorVenta: cashSales
      .filter((s) => s.efectivoRecibidoCentavos != null)
      .map((s) => ({ monto: s.monto, efectivoRecibido: s.efectivoRecibidoCentavos! })),
    egresosEfectivoCentavos: expenses.map((e) => e.monto),
    depositosCentavos: movimientos.filter((m) => m.tipo === 'deposito').map((m) => m.montoCentavos),
    retirosCentavos: movimientos.filter((m) => m.tipo === 'retiro').map((m) => m.montoCentavos),
    cancelacionesEfectivoCentavos: sales
      .filter((s) => s.metodo === 'Efectivo' && s.cancelledAt != null)
      .map((s) => s.monto),
  });

  return balance.efectivoEnCaja;
}

export function CerrarCajaModal(props: CerrarCajaModalProps): ReactElement {
  const turnosRepo = useCajaTurnosRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const [savedConteo, setSavedConteo] = useState<Money | null>(null);
  const [savingConteo, setSavingConteo] = useState(false);

  // We need a reference to the open turno for expected-cash calculation
  // The parent already knows it's open; query it here for the balance
  const openQ = useQuery({
    queryKey: ['cerrar-open-turno', businessId],
    queryFn: async () => {
      // findLatest returns the most recent turno
      return businessId ? turnosRepo.findLatest(businessId as BusinessId) : null;
    },
    enabled: !!businessId,
  });
  const turno = openQ.data ?? null;
  const esperado = useExpectedCash(turno);

  // Check if turno already has a blind count (app-kill recovery)
  const existingConteo =
    turno && (turno as CajaTurno & { conteoCentavos?: Money | null }).conteoCentavos;
  const conteo = savedConteo ?? (existingConteo ?? null);

  if (conteo !== null) {
    // Step 2: show comparison + close
    return (
      <CountResultStep
        conteoCentavos={conteo}
        esperadoCentavos={esperado}
        onClose={(reason, explicacion) => {
          props.onSubmit(conteo, reason, explicacion);
        }}
        submitting={props.submitting}
        testID="cerrar-caja-step-2"
      />
    );
  }

  // Step 1: blind count
  return (
    <BlindCountStep
      onSubmit={async (conteoCentavos) => {
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
      }}
      submitting={savingConteo}
      testID="cerrar-caja-step-1"
    />
  );
}
