/**
 * useEliminarConversionReceta — soft-deletes a recipe.
 * Phase 18.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ConversionRecetaId } from '@cachink/domain';
import { useConversionRecetasRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export function useEliminarConversionReceta(): UseMutationResult<void, Error, ConversionRecetaId> {
  const repo = useConversionRecetasRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<void, Error, ConversionRecetaId>({
    async mutationFn(id) {
      return repo.delete(id);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['conversion-recetas', businessId] });
    },
  });
}
