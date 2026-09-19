import type { BusinessId, Meta, MotivoMeta, NivelMeta, ObjetivoMeta } from '@xangarro/domain';

/** What a month's ledger reads, for a goal's figure. */
export interface TotalesMes {
  readonly ventas: bigint;
  readonly gastos: bigint;
}

/** The store the metas use cases orchestrate over (portal-only table, ADR-060). */
export interface MetasStore {
  readonly activa: (businessId: BusinessId) => Promise<Meta | null>;
  readonly cerradas: (businessId: BusinessId) => Promise<readonly Meta[]>;
  readonly insertar: (meta: Meta) => Promise<void>;
  readonly cerrar: (
    id: string,
    cierre: { readonly lograda: boolean; readonly resultado: bigint; readonly at: string },
  ) => Promise<void>;
}

/** The month totals port — the portal fills it from `totalsForRange`. */
export interface TotalesDelMes {
  (businessId: BusinessId, yearMonth: string): Promise<TotalesMes>;
}

export interface FijarMetaInput {
  readonly businessId: BusinessId;
  readonly objetivo: ObjetivoMeta;
  readonly motivo: MotivoMeta;
  readonly nivel: NivelMeta;
  /** The business's today (`YYYY-MM-DD`); the goal covers its month. */
  readonly hoy: string;
}
