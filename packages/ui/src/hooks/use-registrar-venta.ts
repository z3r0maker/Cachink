/**
 * `useRegistrarVenta` — TanStack mutation wrapping the
 * `RegistrarVentaUseCase`.
 *
 * Wires the clients + sales repositories into the use-case, calls
 * `.execute(input)`, and invalidates the current day's `['ventas', …]`
 * query on success so the list refreshes immediately. Callers invoke
 * `.mutate({ fecha, concepto, categoria, monto, metodo, clienteId? })`.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarVentaUseCase } from '@cachink/application';
import type { NewSale, Sale } from '@cachink/domain';
import { useClientsRepository, useSalesRepository } from '../app/index';
import { useCurrentBusinessId } from '../app-config/index';

export type RegistrarVentaResult = UseMutationResult<Sale, Error, NewSale, unknown>;

export function useRegistrarVenta(): RegistrarVentaResult {
  const sales = useSalesRepository();
  const clients = useClientsRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const useCase = useMemo(() => new RegistrarVentaUseCase(sales, clients), [sales, clients]);

  return useMutation<Sale, Error, NewSale>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(sale) {
      await queryClient.invalidateQueries({ queryKey: ['ventas', businessId, sale.fecha] });
    },
  });
}
