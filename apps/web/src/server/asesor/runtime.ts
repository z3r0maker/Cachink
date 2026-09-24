import 'server-only';

import { calcularInsights, filtrarPorCadencia } from '@xangarro/domain';
import { asesorInputs, materializarInsights } from '@xangarro/data-pg';

import { tenantEntitlement } from '../billing/plan';
import { withTenant, type Tx } from '../db';
import { hoy } from '../clock';

/**
 * One business's Asesor generation (P-30, ADR-056).
 *
 * **The deterministic layer, and only that.** ADR-056 orders the two halves —
 * figures from `@xangarro/domain` first, the model prompted from those values
 * last — so that a figure is never computed twice by two paths. The second
 * half is not here because it has nowhere to be stored yet: the Diagnóstico
 * is `<p>Reporte completo del mes.</p>` behind two gates until P-28 builds
 * the report, and prose written into a table no screen reads is prose nobody
 * can check. The model boundary stays the single module ADR-056 requires
 * (`./model.ts`), and this is where its call joins when P-28 lands.
 *
 * The unit of work is one business, which is ADR-056's structural
 * requirement, not a performance note. Choosing *which* businesses are due is
 * the caller's job and deliberately not this module's.
 *
 * Nothing here needs a credential. With the model unset — CI, a fresh clone,
 * production before the credential — this runs unchanged and still writes the
 * `notices` the «Para ti» feed reads.
 */
export type Cadencia = 'semanal' | 'diario' | 'completo';

export interface GeneracionResultado {
  readonly businessId: string;
  /** The plan's tier, which decides how many rows get written (ADR-056). */
  readonly cadencia: Cadencia;
  /** Insights upserted into `notices` this run. */
  readonly materializados: number;
  /** Insights that no longer compute, closed as «listo». */
  readonly cerrados: number;
}

export interface GenerarDeps {
  /** Billing's clock: the entitlement is read as of this instant. */
  readonly now: Date;
}

/**
 * Compute this business's insights and materialise them.
 *
 * Idempotent by construction: `materializarInsights` upserts on
 * `business:clave` and never touches `state` or `resolved_at`, so a second run
 * in the same day rewrites the same rows, a member's dismissal survives it,
 * and an insight that fixed itself closes as «listo».
 */
export async function generarParaNegocio(
  businessId: string,
  deps: GenerarDeps,
): Promise<GeneracionResultado> {
  const dia = hoy();
  const entitlement = await withTenant(businessId, (tx: Tx) =>
    tenantEntitlement(tx, businessId, deps.now),
  );
  const cadencia = entitlement.capabilities.asesor;

  const inputs = await withTenant(businessId, (tx) => asesorInputs(tx, dia));
  const visibles = filtrarPorCadencia(calcularInsights(inputs), cadencia);
  const { materializados, cerrados } = await withTenant(businessId, (tx) =>
    materializarInsights(tx, businessId, visibles),
  );

  return { businessId, cadencia, materializados, cerrados };
}
