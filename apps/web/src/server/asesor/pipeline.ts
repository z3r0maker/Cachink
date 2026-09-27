import 'server-only';

import { calcularInsights, filtrarPorCadencia, type IsoDate } from '@xangarro/domain';
import { asesorInputs, materializarInsights } from '@xangarro/data-pg';

import { withTenant } from '../db';

/**
 * The Asesor's deterministic pipeline, in the one place it exists.
 *
 * Two callers need these same four steps and differ only at their edges: the
 * page (`../asesor.ts`) reads the resulting feed and its capacidades, the
 * scheduled run (`./runtime.ts`) resolves the cadencia from the entitlement and
 * reports counts. The middle is load-bearing precisely because both share it —
 * `loadAsesorPage` materialises on read (ADR-088), so a second copy that
 * drifted would silently overwrite the scheduled run's rows with different
 * ones. There is no second copy.
 *
 * ADR-056's ordering is the sequence itself: read the tenant's rows, compute
 * from `@xangarro/domain`, filter to what the tier receives (ADR-059), and
 * only then write. Anything that wrote before filtering would store rows the
 * plan may not receive.
 */
export type Cadencia = 'semanal' | 'diario' | 'completo';

/** The rows `asesorInputs` read — the caller derives its own view from them. */
export type AsesorInputs = Awaited<ReturnType<typeof asesorInputs>>;

export interface MaterializacionResultado {
  /** What the insights were computed from, for whatever else the caller needs. */
  readonly inputs: AsesorInputs;
  /** Insights upserted into `notices` this run. */
  readonly materializados: number;
  /** Insights that no longer compute, closed as «listo». */
  readonly cerrados: number;
}

/**
 * Compute one business's insights for `dia` and materialise them.
 *
 * Idempotent by construction: `materializarInsights` upserts on
 * `business:clave` and never touches `state` or `resolved_at`, so a second run
 * in the same day rewrites the same rows, a member's dismissal survives it,
 * and an insight that fixed itself closes as «listo».
 */
export async function materializarParaNegocio(
  businessId: string,
  cadencia: Cadencia,
  dia: IsoDate,
): Promise<MaterializacionResultado> {
  const inputs = await withTenant(businessId, (tx) => asesorInputs(tx, dia));
  const visibles = filtrarPorCadencia(calcularInsights(inputs), cadencia);
  const { materializados, cerrados } = await withTenant(businessId, (tx) =>
    materializarInsights(tx, businessId, visibles),
  );

  return { inputs, materializados, cerrados };
}
