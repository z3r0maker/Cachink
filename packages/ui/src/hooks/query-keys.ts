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

export const corteKeys = {
  delDia: (businessId: BusinessId | null): readonly unknown[] =>
    ['corte-del-dia', businessId] as const,
  historial: (businessId: BusinessId | null): readonly unknown[] =>
    ['corte-historial', businessId] as const,
  efectivoEsperado: (businessId: BusinessId | null, fecha: IsoDate | string): readonly unknown[] =>
    ['efectivo-esperado', businessId, fecha] as const,
  /** Surfaces that MUST invalidate after a corte closes. */
  dependentsForBusiness: (businessId: BusinessId | null): readonly (readonly unknown[])[] => [
    ['corte-del-dia', businessId] as const,
    ['corte-historial', businessId] as const,
    ['efectivo-esperado', businessId] as const,
    ['balance-general', businessId] as const,
  ],
} as const;

export const estadosKeys = {
  resultados: (businessId: BusinessId | null, from: string, to: string): readonly unknown[] =>
    ['estado-resultados', businessId, from, to] as const,
  balance: (businessId: BusinessId | null, from: string, to: string): readonly unknown[] =>
    ['balance-general', businessId, from, to] as const,
  flujo: (businessId: BusinessId | null, from: string, to: string): readonly unknown[] =>
    ['flujo-efectivo', businessId, from, to] as const,
  indicadores: (businessId: BusinessId | null, from: string, to: string): readonly unknown[] =>
    ['indicadores', businessId, from, to] as const,
} as const;

export const frequentProductosKeys = {
  byBusiness: (businessId: BusinessId | null, days: number): readonly unknown[] =>
    ['frequentProductos', businessId, days] as const,
} as const;

export const syncKeys = {
  /** Recent LAN sync conflicts surfaced in DirectorHome (ADR-029). */
  conflicts: (limit: number): readonly unknown[] => ['sync-conflicts', limit] as const,
  /** LAN pairing material stored in `__cachink_sync_state` (Slice 8 C1). */
  lanAuth: (): readonly unknown[] => ['sync-lan-auth'] as const,
  /**
   * @deprecated Removed in ADR-039 — kept as a key factory for any
   * residual `invalidateQueries` calls that haven't been swept yet.
   * Reads against this key always return null because `useLanRole` is
   * retired.
   */
  lanRole: (): readonly unknown[] => ['sync-lan-role'] as const,
  /**
   * Host-side flag stamped after the bundled Tauri LAN server reports
   * ready (Slice 8 A2 revision). Replaces the prior `'cachink-host'`
   * `auth.accessToken` sentinel — see `sync-state.ts` for the rationale.
   */
  lanHostReady: (): readonly unknown[] => ['sync-lan-host-ready'] as const,
  /** Pending push HWM for the unsynced-changes blocker (ADR-039). */
  pendingChanges: (): readonly unknown[] => ['sync-pending-changes'] as const,
  /** BYO backend config for Cloud mode (Slice 8 C4). */
  cloudByoBackend: (): readonly unknown[] => ['sync-cloud-byo'] as const,
} as const;
