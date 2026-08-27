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
import { estadosKeys } from './query-keys';
import { useFeatureFlag } from './use-feature-flags';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_REGISTRAR_VENTA } from '../observability/audit-configs';

export type RegistrarVentaResult = UseMutationResult<Sale, Error, NewSale, unknown>;

async function checkStockBajo(
  sale: Sale,
  businessId: string | null,
  products: ReturnType<typeof useProductsRepository>,
  movements: ReturnType<typeof useInventoryMovementsRepository>,
  emitAlert: ReturnType<typeof useEmitDirectorAlert>,
): Promise<void> {
  if (!businessId) return;
  const product = await products.findById(sale.productoId);
  if (!product || !product.seguirStock) return;
  const stock = await movements.sumStock(sale.productoId);
  const umbral = product.umbralStockBajo ?? 3;
  if (stock <= umbral) {
    emitAlert.mutate({
      source: 'stock-bajo',
      severity: 'warning',
      titleKey: 'notificaciones.stockBajo',
      message: `${product.nombre}: quedan ${stock} unidades (umbral: ${umbral}).`,
      actionRoute: '/productos',
      metadata: JSON.stringify({ productoId: sale.productoId, stock, umbral }),
      dedupeKey: sale.productoId as string,
    });
  }
}

function emitCreditoAlert(sale: Sale, emitAlert: ReturnType<typeof useEmitDirectorAlert>): void {
  if (sale.metodo !== 'Crédito') return;
  emitAlert.mutate({
    source: 'credito-entrega',
    severity: 'info',
    titleKey: 'notificaciones.creditoEntrega',
    message: `Se registró una venta a crédito: ${sale.concepto}.`,
    actionRoute: '/ventas-credito',
    metadata: JSON.stringify({ saleId: sale.id }),
  });
}

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

  const rawUseCase = useMemo(
    () =>
      new RegistrarVentaUseCase(sales, clients, products, movements, cajaTurnos, {
        stockEnabled,
        userId,
      }),
    [sales, clients, products, movements, cajaTurnos, stockEnabled, userId],
  );
  const useCase = useAuditedUseCase(rawUseCase, AUDIT_REGISTRAR_VENTA);
  const emitAlert = useEmitDirectorAlert();

  return useMutation<Sale, Error, NewSale>({
    async mutationFn(input) {
      return useCase.execute(input);
    },
    async onSuccess(sale) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ventas', businessId, sale.fecha] }),
        queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
        queryClient.invalidateQueries({ queryKey: ['frequentProductos', businessId] }),
        ...estadosKeys
          .dependentsForBusiness(businessId)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
      emitCreditoAlert(sale, emitAlert);
      if (stockEnabled && sale.productoId) {
        void checkStockBajo(sale, businessId, products, movements, emitAlert);
      }
    },
  });
}
