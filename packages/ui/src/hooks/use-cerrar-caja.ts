/**
 * `useCerrarCaja` — TanStack mutation wrapping `CerrarCajaUseCase`.
 * Invalidates caja, sales, and expenses queries on close.
 *
 * Issue 5 fix — Second Audit.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { CerrarCajaUseCase, type CerrarCajaFullInput } from '@cachink/application';
import { formatMoney } from '@cachink/domain';
import type { BusinessId, CajaTurno, CajaTurnoId, DiscrepancyReason, Money } from '@cachink/domain';
import { useCajaTurnosRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { cajaKeys, estadosKeys } from './query-keys';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_CERRAR_CAJA } from '../observability/audit-configs';

export interface CerrarCajaHookInput {
  readonly turnoId: CajaTurnoId;
  readonly montoCierreCentavos: Money;
  readonly discrepancyReason: DiscrepancyReason | null;
  readonly explicacion: string | null;
}

export type CerrarCajaResult = UseMutationResult<CajaTurno, Error, CerrarCajaHookInput, unknown>;

function buildFullInput(input: CerrarCajaHookInput, businessId: BusinessId): CerrarCajaFullInput {
  return {
    turnoId: input.turnoId,
    montoCierreCentavos: input.montoCierreCentavos,
    discrepancyReason: input.discrepancyReason,
    explicacion: input.explicacion,
    businessId,
  };
}

function emitCajaAlerts(
  turno: CajaTurno,
  emitAlert: ReturnType<typeof useEmitDirectorAlert>,
): void {
  const diff = turno.diferenciaCentavos ?? 0n;
  if (diff !== 0n) {
    const absDiff = diff < 0n ? -diff : diff;
    const severity = absDiff >= 500_00n ? 'critical' : 'warning';
    emitAlert.mutate({
      source: 'caja-discrepancia',
      severity,
      titleKey: 'notificaciones.cajaDiscrepancia',
      message: `Diferencia de ${formatMoney(diff)} al cerrar turno.`,
      actionRoute: '/caja-reportes',
      metadata: JSON.stringify({ turnoId: turno.id, diff: String(diff) }),
    });
  }

  if (turno.egresoAutoId) {
    emitAlert.mutate({
      source: 'caja-egreso-auto',
      severity: 'info',
      titleKey: 'notificaciones.cajaEgresoAuto',
      message: 'Se creó un egreso automático para registrar la diferencia de caja.',
      actionRoute: '/egresos',
      metadata: JSON.stringify({ egresoId: turno.egresoAutoId }),
    });
  }
}

export function useCerrarCaja(): CerrarCajaResult {
  const turnos = useCajaTurnosRepository();
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  const rawUseCase = useMemo(
    () => new CerrarCajaUseCase(turnos, sales, expenses),
    [turnos, sales, expenses],
  );
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_CERRAR_CAJA);
  const emitAlert = useEmitDirectorAlert();

  return useMutation<CajaTurno, Error, CerrarCajaHookInput>({
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useCerrarCaja: no current business set');
      }
      return useCase.execute(buildFullInput(input, businessId as BusinessId));
    },
    async onSuccess(turno) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cajaKeys.byBusiness(businessId as BusinessId) }),
        queryClient.invalidateQueries({ queryKey: ['caja-open'] }),
        queryClient.invalidateQueries({ queryKey: ['egresos', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['efectivo-esperado', businessId] }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
      emitCajaAlerts(turno, emitAlert);
    },
  });
}
