/**
 * `useCerrarCorteDeDia` — TanStack mutation wrapping
 * `CerrarCorteDeDiaUseCase` (Slice 3 C4).
 *
 * The use-case enforces the one-per-(fecha, deviceId) rule and derives
 * the esperado — the UI only supplies contado + explicación. On success
 * we invalidate every downstream query that reads cortes or the
 * balance-general surface.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { CerrarCorteDeDiaUseCase, type CerrarCorteDeDiaInput } from '@cachink/application';
import type { DayClose } from '@cachink/domain';
import { useDayClosesRepository, useExpensesRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

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
  const useCase = useMemo(
    () => new CerrarCorteDeDiaUseCase(sales, expenses, closes),
    [sales, expenses, closes],
  );

  return useMutation<DayClose, Error, CerrarCorteDeDiaInput>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['corte-del-dia', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['corte-historial', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['efectivo-esperado', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['balance-general', businessId] }),
      ]);
    },
  });
}
