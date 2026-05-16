/**
 * useEjecutarConversion — mutation wrapping EjecutarConversionUseCase.
 * Phase 18.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, ConversionRecetaId, IsoDate } from '@cachink/domain';
import {
  EjecutarConversionUseCase,
  type EjecutarConversionResult,
} from '@cachink/application';
import {
  useConversionRecetasRepository,
  useConversionsRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
} from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface EjecutarConversionMutationInput {
  readonly recetaId: ConversionRecetaId;
  readonly multiplicador: number;
  readonly today?: IsoDate;
}

export function useEjecutarConversion(): UseMutationResult<
  EjecutarConversionResult,
  Error,
  EjecutarConversionMutationInput
> {
  const recetas = useConversionRecetasRepository();
  const conversions = useConversionsRepository();
  const movements = useInventoryMovementsRepository();
  const products = useProductsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<EjecutarConversionResult, Error, EjecutarConversionMutationInput>({
    async mutationFn(input) {
      if (!businessId) throw new Error('No current business');
      const useCase = new EjecutarConversionUseCase(recetas, conversions, movements, products);
      return useCase.execute({
        ...input,
        businessId: businessId as BusinessId,
      });
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['conversiones', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['movimientos', businessId] }),
      ]);
    },
  });
}
