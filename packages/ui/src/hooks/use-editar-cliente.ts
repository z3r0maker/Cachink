/**
 * `useEditarCliente` — TanStack mutation wrapping
 * ClientsRepository.update per ADR-023. Invalidates cliente queries
 * on success.
 */

import { useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { Client, ClientId } from '@cachink/domain';
import type { ClientPatch } from '@cachink/data';
import { useClientsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';
import { useAuditedMutation } from '../observability/use-audited-mutation';
import { MUTATION_EDITAR_CLIENTE } from '../observability/audit-configs';

export interface EditarClienteInput {
  readonly id: ClientId;
  readonly patch: ClientPatch;
}

export type EditarClienteResult = UseMutationResult<
  Client | null,
  Error,
  EditarClienteInput,
  unknown
>;

export function useEditarCliente(): EditarClienteResult {
  const clients = useClientsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useAuditedMutation(MUTATION_EDITAR_CLIENTE, {
    async mutationFn(input) {
      return clients.update(input.id, input.patch);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}
