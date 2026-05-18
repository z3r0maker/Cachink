/**
 * useEliminarConversionReceta — soft-deletes a recipe.
 * Phase 18.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ConversionRecetaId } from '@cachink/domain';
import { useConversionRecetasRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_ELIMINAR_RECETA } from '../observability/audit-configs';

export function useEliminarConversionReceta(): UseMutationResult<void, Error, ConversionRecetaId> {
  const repo = useConversionRecetasRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_ELIMINAR_RECETA, {
    async mutationFn(id) {
      await repo.delete(id);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['conversion-recetas', businessId] });
    },
  });
}
