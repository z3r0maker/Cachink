/**
 * `useEditarVenta` — TanStack mutation wrapping
 * `EditarVentaUseCase.execute`. Invalidates ventas + cliente queries
 * on success so the lists / Cuentas-por-cobrar / Estados-financieros
 * surfaces refresh.
 *
 * Audit Round 2 J1: powers the swipe-to-edit handler on the Ventas
 * list (Phase K wiring).
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { Sale, SaleId } from '@cachink/domain';
import type { SalePatch } from '@cachink/data';
import { EditarVentaUseCase } from '@cachink/application';
import { useClientsRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export interface EditarVentaInput {
  readonly id: SaleId;
  readonly patch: SalePatch;
}

export type EditarVentaResult = UseMutationResult<Sale, Error, EditarVentaInput, unknown>;

export function useEditarVenta(): EditarVentaResult {
  const sales = useSalesRepository();
  const clients = useClientsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();

  // Construct the use-case once per repository swap; identity is
  // stable across renders so consumers can tap the mutation safely.
  const useCase = useMemo(() => new EditarVentaUseCase(sales, clients), [sales, clients]);

  return useMutation<Sale, Error, EditarVentaInput>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: ['sales', businessId] });
      await queryClient.invalidateQueries({ queryKey: ['clients', businessId] });
    },
  });
}
