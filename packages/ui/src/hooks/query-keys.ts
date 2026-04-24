/**
 * Query-key factory for TanStack Query (Slice 2 C29).
 *
 * Centralizing the keys means mutations and queries can't drift — if
 * `useRegistrarPago` invalidates `paymentKeys.allByBusiness(biz)` and
 * `useVentasByDate` queries under the same prefix, the refresh chain
 * can't get out of sync just because one file typoed a string.
 *
 * Existing hooks still use raw tuples for backward compat; new code
 * should prefer these factories. All factories return `readonly any[]`
 * so they drop into `queryClient.invalidateQueries({ queryKey })`
 * without a cast.
 */

import type { BusinessId, ClientId, IsoDate } from '@cachink/domain';

export const ventaKeys = {
  all: ['ventas'] as const,
  byBusiness: (businessId: BusinessId | null): readonly unknown[] =>
    ['ventas', businessId] as const,
  byDate: (businessId: BusinessId | null, fecha: IsoDate | string): readonly unknown[] =>
    ['ventas', businessId, fecha] as const,
} as const;

export const clienteKeys = {
  all: ['clients'] as const,
  byBusiness: (businessId: BusinessId | null): readonly unknown[] =>
    ['clients', businessId] as const,
  detail: (businessId: BusinessId | null, id: ClientId | null): readonly unknown[] =>
    ['cliente-detail', businessId, id] as const,
} as const;

export const cxcKeys = {
  byBusiness: (businessId: BusinessId | null): readonly unknown[] =>
    ['cuentasPorCobrar', businessId] as const,
} as const;

export const pagoKeys = {
  /** Surfaces that MUST invalidate after a pago lands. */
  dependentsForBusiness: (businessId: BusinessId | null): readonly (readonly unknown[])[] => [
    ventaKeys.byBusiness(businessId),
    cxcKeys.byBusiness(businessId),
    ['cliente-detail', businessId] as const,
  ],
} as const;
