/**
 * useCrearConversionReceta — mutation wrapping ConversionRecetasRepository.create.
 * Phase 18.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, ConversionReceta, ProductId } from '@cachink/domain';
import { useConversionRecetasRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_CREAR_RECETA } from '../observability/audit-configs';

export interface CrearRecetaInput {
  readonly materiaPrimaId: ProductId;
  readonly productoResultanteId: ProductId;
  readonly cantidadOrigen: number;
  readonly cantidadResultante: number;
}

export function useCrearConversionReceta(): UseMutationResult<ConversionReceta, Error, CrearRecetaInput> {
  const repo = useConversionRecetasRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_CREAR_RECETA, {
    async mutationFn(input) {
      if (!businessId) throw new Error('No current business');
      return repo.create({ ...input, businessId: businessId as BusinessId });
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['conversion-recetas', businessId] });
    },
  });
}
