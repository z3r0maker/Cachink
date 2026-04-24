/**
 * `useEliminarCliente` — TanStack mutation wrapping
 * ClientsRepository.delete (soft-delete). Phase 1C guardrail:
 * refuses to delete a cliente with pending Crédito ventas unless
 * `force=true` is explicitly passed.
 *
 * The check is O(1) against findPendingByClient, then a soft-delete
 * on success.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { ClientId } from '@cachink/domain';
import { useClientsRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export class ClientPendingSalesError extends Error {
  constructor(public readonly pendingCount: number) {
    super(`Cliente has ${pendingCount} ventas pendientes. Cannot delete.`);
    this.name = 'ClientPendingSalesError';
  }
}

export interface EliminarClienteInput {
  readonly id: ClientId;
  readonly force?: boolean;
}

export type EliminarClienteResult = UseMutationResult<void, Error, EliminarClienteInput, unknown>;

export function useEliminarCliente(): EliminarClienteResult {
  const clients = useClientsRepository();
  const sales = useSalesRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<void, Error, EliminarClienteInput>({
    async mutationFn(input) {
      if (input.force !== true) {
        const pending = await sales.findPendingByClient(input.id);
        if (pending.length > 0) throw new ClientPendingSalesError(pending.length);
      }
      await clients.delete(input.id);
    },
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['clients', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['cuentasPorCobrar', businessId] }),
      ]);
    },
  });
}
