import 'server-only';

import { tenantEntitlement } from '../billing/plan';
import { withTenant, type Tx } from '../db';
import { hoy } from '../clock';
import { materializarParaNegocio, type Cadencia } from './pipeline';

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
 * The four deterministic steps themselves live in `./pipeline.ts`, which the
 * Asesor page shares: what this module owns is the *entitlement* — resolving
 * which cadencia the plan grants — and reporting what the run wrote.
 *
 * The unit of work is one business, which is ADR-056's structural
 * requirement, not a performance note. Choosing *which* businesses are due is
 * the caller's job and deliberately not this module's.
 *
 * Nothing here needs a credential. With the model unset — CI, a fresh clone,
 * production before the credential — this runs unchanged and still writes the
 * `notices` the «Para ti» feed reads.
 */
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
 * Resolve the plan's cadencia, then run the deterministic pipeline for today.
 *
 * Idempotent by construction — see `materializarParaNegocio`.
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

  const { materializados, cerrados } = await materializarParaNegocio(businessId, cadencia, dia);

  return { businessId, cadencia, materializados, cerrados };
}

export type { Cadencia };
