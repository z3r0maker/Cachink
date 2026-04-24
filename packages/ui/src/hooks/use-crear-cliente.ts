/**
 * `useCrearCliente` — TanStack mutation wrapping
 * `ClientsRepository.create`. Invalidates `['clients', businessId]` so
 * selects pick up the new row immediately.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { BusinessId, Client, NewClient } from '@cachink/domain';
import { useClientsRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface CrearClienteInput {
  readonly nombre: string;
  readonly telefono?: string;
  readonly email?: string;
  readonly nota?: string;
}

export type CrearClienteResult = UseMutationResult<Client, Error, CrearClienteInput, unknown>;

export function useCrearCliente(): CrearClienteResult {
  const clients = useClientsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  return useMutation<Client, Error, CrearClienteInput>({
    async mutationFn(input) {
      if (!businessId) {
        throw new Error('useCrearCliente: no current business set');
      }
      const payload: NewClient = {
        nombre: input.nombre,
        telefono: input.telefono?.trim() || undefined,
        email: input.email?.trim() || undefined,
        nota: input.nota?.trim() || undefined,
        businessId: businessId as BusinessId,
      };
      return clients.create(payload);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}
