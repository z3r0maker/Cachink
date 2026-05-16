/**
 * `useRegistrarVenta` — TanStack mutation wrapping the
 * `RegistrarVentaUseCase`.
 *
 * Wires the clients + sales + products + movements repositories into the
 * use-case, calls `.execute(input)`, and invalidates ventas +
 * productos-con-stock queries on success.
 *
 * UXD-R3: now passes products + movements repos to support auto-salida
 * when selling a stock-tracked producto.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { RegistrarVentaUseCase } from '@cachink/application';
import type { NewSale, Sale } from '@cachink/domain';
import {
  useCajaTurnosRepository,
  useClientsRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useSalesRepository,
} from '../app/index';
import { useCurrentBusinessId, useUserId } from '../app-config/index';
import { useFeatureFlag } from './use-feature-flags';

export type RegistrarVentaResult = UseMutationResult<Sale, Error, NewSale, unknown>;

export function useRegistrarVenta(): RegistrarVentaResult {
  const sales = useSalesRepository();
  const clients = useClientsRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const cajaTurnos = useCajaTurnosRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const userId = useUserId();
  const stockEnabled = useFeatureFlag('stock');

  const useCase = useMemo(
    () => new RegistrarVentaUseCase(
      sales, clients, products, movements, cajaTurnos,
      { stockEnabled, userId },
    ),
    [sales, clients, products, movements, cajaTurnos, stockEnabled, userId],
  );

  return useMutation<Sale, Error, NewSale>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(sale) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ventas', businessId, sale.fecha] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['frequentProductos', businessId] }),
      ]);
    },
  });
}
