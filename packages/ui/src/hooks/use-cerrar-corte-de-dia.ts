/**
 * `useCerrarCorteDeDia` — TanStack mutation wrapping
 * `CerrarCorteDeDiaUseCase` (Slice 3 C4).
 *
 * The use-case enforces the one-per-(fecha, deviceId) rule and derives
 * the esperado — the UI only supplies contado + explicación. On success
 * we invalidate every downstream query that reads cortes.
 *
 * Review item #9: this used to invalidate `['balance-general']` alone.
 * `useBalanceGeneral` does compose the period's cortes — but so does
 * Flujo de Efectivo (NIF B-2 is cash movement by definition), and
 * Indicadores derives from both. Cherry-picking one of the four left
 * the others serving a pre-corte number, so the full estados sweep
 * runs here.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { CerrarCorteDeDiaUseCase, type CerrarCorteDeDiaInput } from '@cachink/application';
import type { DayClose } from '@cachink/domain';
import { useDayClosesRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { estadosKeys } from './query-keys';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_CERRAR_CORTE } from '../observability/audit-configs';

export type CerrarCorteDeDiaResult = UseMutationResult<
  DayClose,
  Error,
  CerrarCorteDeDiaInput,
  unknown
>;

export function useCerrarCorteDeDia(): CerrarCorteDeDiaResult {
  const sales = useSalesRepository();
  const expenses = useExpensesRepository();
  const closes = useDayClosesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const rawUseCase = useMemo(
    () => new CerrarCorteDeDiaUseCase(sales, expenses, closes),
    [sales, expenses, closes],
  );
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_CERRAR_CORTE);

  return useMutation<DayClose, Error, CerrarCorteDeDiaInput>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['corte-del-dia', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['corte-historial', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['efectivo-esperado', businessId] }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });
}
