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
import {
  RegistrarTicketUseCase,
  RegistrarVentaUseCase,
  type RegistrarVentaInput,
} from '@xangarro/application';
import type { BusinessId, Sale, UserId } from '@xangarro/domain';
import {
  useCajaTurnosRepository,
  useClientsRepository,
  useInventoryMovementsRepository,
  useProductsRepository,
  useSalesRepository,
  useTicketsRepository,
} from '../app/index';
import { useCurrentBusinessId, useUserId } from '../app-config/index';
import { estadosKeys } from './query-keys';
import { useFeatureFlag } from './use-feature-flags';
import { useEmitDirectorAlert } from './use-emit-director-alert';
import { useAuditedUseCase } from '../observability/index';
import { AUDIT_REGISTRAR_VENTA } from '../observability/audit-configs';

export type RegistrarVentaResult = UseMutationResult<Sale, Error, RegistrarVentaInput, unknown>;

async function checkStockBajo(
  sale: Sale,
  businessId: BusinessId | null,
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
  emitAlert.mutate({
    source: 'credito-entrega',
    severity: 'info',
    titleKey: 'notificaciones.creditoEntrega',
    message: `Se registró una venta a crédito: ${sale.concepto}.`,
    actionRoute: '/ventas-credito',
    metadata: JSON.stringify({ saleId: sale.id }),
  });
}

/** The audited use case, memoised once per repository swap. */
function useRegistrarUseCase(
  tickets: ReturnType<typeof useTicketsRepository>,
  sales: ReturnType<typeof useSalesRepository>,
  clients: ReturnType<typeof useClientsRepository>,
  products: ReturnType<typeof useProductsRepository>,
  movements: ReturnType<typeof useInventoryMovementsRepository>,
  cajaTurnos: ReturnType<typeof useCajaTurnosRepository>,
  stockEnabled: boolean,
  userId: UserId | null,
): RegistrarVentaUseCase {
  return useMemo(
    () =>
      new RegistrarVentaUseCase(
        new RegistrarTicketUseCase(tickets, sales, clients, products, movements, cajaTurnos, {
          stockEnabled,
          userId,
        }),
      ),
    [tickets, sales, clients, products, movements, cajaTurnos, stockEnabled, userId],
  );
}

/** Every cached surface a new venta changes. */
async function invalidateVentaSurfaces(
  queryClient: ReturnType<typeof useQueryClient>,
  businessId: BusinessId | null,
  fecha: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['ventas', businessId, fecha] }),
    queryClient.invalidateQueries({ queryKey: ['productos-con-stock', businessId] }),
    queryClient.invalidateQueries({ queryKey: ['frequentProductos', businessId] }),
    ...estadosKeys
      .dependentsForBusiness(businessId)
      .map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  ]);
}

export function useRegistrarVenta(): RegistrarVentaResult {
  const tickets = useTicketsRepository();
  const sales = useSalesRepository();
  const clients = useClientsRepository();
  const products = useProductsRepository();
  const movements = useInventoryMovementsRepository();
  const cajaTurnos = useCajaTurnosRepository();
  const queryClient = useQueryClient();
  const businessId = useCurrentBusinessId();
  const userId = useUserId();
  const stockEnabled = useFeatureFlag('stock');

  const useCase = useAuditedUseCase(
    useRegistrarUseCase(
      tickets,
      sales,
      clients,
      products,
      movements,
      cajaTurnos,
      stockEnabled,
      userId,
    ),
    AUDIT_REGISTRAR_VENTA,
  );
  const emitAlert = useEmitDirectorAlert();

  return useMutation<Sale, Error, RegistrarVentaInput>({
    async mutationFn(input) {
      return useCase.execute(input as never);
    },
    async onSuccess(sale, input) {
      await invalidateVentaSurfaces(queryClient, businessId, sale.fecha);
      if ((input as { metodo?: string }).metodo === 'Crédito') {
        emitCreditoAlert(sale, emitAlert);
      }
      if (stockEnabled && sale.productoId) {
        void checkStockBajo(sale, businessId, products, movements, emitAlert);
      }
    },
  });
}
