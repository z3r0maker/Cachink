/**
 * `useEditarBusiness` — TanStack mutation that patches an existing
 * business (nombre, regimenFiscal, isrTasa). Used by the Settings
 * screen's EditBusinessModal.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { Business, BusinessId } from '@cachink/domain';
import type { BusinessPatch } from '@cachink/data';
import { useBusinessesRepository } from '../app/repository-provider';

export interface EditarBusinessInput {
  readonly id: BusinessId;
  readonly patch: BusinessPatch;
}

export type EditarBusinessResult = UseMutationResult<Business, Error, EditarBusinessInput, unknown>;

export function useEditarBusiness(): EditarBusinessResult {
  const businesses = useBusinessesRepository();
  const queryClient = useQueryClient();

  return useMutation<Business, Error, EditarBusinessInput>({
    async mutationFn(input) {
      return businesses.update(input.id, input.patch);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['currentBusiness'] });
    },
  });
}
