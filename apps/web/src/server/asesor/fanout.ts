import 'server-only';

import { liveBusinessIds } from '@xangarro/data-pg';

import { reportError, type ReportScope } from '../observability/report';
import { meteringDb } from '../usage/live';
import { generarParaNegocio, type GeneracionResultado } from './runtime';

/**
 * The daily fan-out (P-30, ADR-056 «a daily job selects the businesses that
 * are due»; ADR-109 §1).
 *
 * **Who enumerates the tenants.** The `xangarro_metering` connection, which
 * the portal already holds for the nightly usage recompute. The three
 * candidates were a new privileged function, this role, and the console's
 * service role; this one needs **no migration and no new secret**, because
 * 0010 already grants it `SELECT (id, deleted_at) ON public.businesses` beside
 * a `metering_read` policy so that `usage_counts(NULL, …)` can enumerate the
 * same set. The service role was never eligible: CLAUDE.md §3 makes the
 * backoffice the only project that may hold it, and a portal cron reaching
 * for it would either move the key or move the cron.
 *
 * **The pass is universal and deterministic** (ADR-109 §1): every live
 * business, no tier filter and no activity gate, because it is one SQL read
 * per tenant and its point is that the insights are already waiting the moment
 * someone logs in. The activity gate belongs to the *monthly* Diagnóstico,
 * which is the only part that costs money and which has nowhere to be stored
 * until P-28.
 *
 * **One tenant's failure is one tenant's failure.** Each business is caught,
 * reported under its own id and tallied; the sweep continues. The run answers
 * 200 with `fallidos` listed, as the usage recompute does — a scheduled job
 * that 500s on the first bad tenant hides every tenant behind it.
 */
export interface FanOutDeps {
  readonly negocios: () => Promise<readonly string[]>;
  readonly generar: (businessId: string, now: Date) => Promise<GeneracionResultado>;
  readonly report: (error: unknown, scope: ReportScope) => void;
  /** Stop starting new tenants after this much wall clock. */
  readonly limiteMs: number;
  readonly transcurrido: () => number;
}

export interface FanOutFallo {
  readonly businessId: string;
  readonly error: string;
}

export interface FanOutResultado {
  readonly negocios: number;
  readonly generados: number;
  readonly materializados: number;
  readonly cerrados: number;
  readonly fallidos: readonly FanOutFallo[];
  /**
   * Businesses the deadline was reached before. Non-zero means the sweep no
   * longer fits one invocation and wants sharding by id range — **not** that a
   * tenant lost its insights: `loadAsesorPage` materialises the same pipeline
   * on read (ADR-088), so this pass is a warm-up and never the correctness
   * path. Reported so it is loud rather than silent.
   */
  readonly restantes: number;
}

/** Sequential, like the usage recompute: `generarParaNegocio` opens three
 * transactions per business, and a serverless function's pool is small. */
export async function fanOutAsesor(deps: FanOutDeps, now: Date): Promise<FanOutResultado> {
  const ids = await deps.negocios();
  const fallidos: FanOutFallo[] = [];
  let generados = 0;
  let materializados = 0;
  let cerrados = 0;
  let hechos = 0;

  for (const businessId of ids) {
    if (deps.transcurrido() >= deps.limiteMs) break;
    hechos += 1;
    try {
      const r = await deps.generar(businessId, now);
      generados += 1;
      materializados += r.materializados;
      cerrados += r.cerrados;
    } catch (error) {
      deps.report(error, { endpoint: 'cron/asesor', businessId });
      fallidos.push({ businessId, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const restantes = ids.length - hechos;
  if (restantes > 0) {
    deps.report(new Error(`fan-out truncado: ${restantes} negocios sin recorrer`), {
      endpoint: 'cron/asesor',
    });
  }
  return { negocios: ids.length, generados, materializados, cerrados, fallidos, restantes };
}

/** Vercel's default function budget is 300s; stop well inside it. */
const LIMITE_MS = 240_000;

/** The production wiring. */
export const fanOutDeps = (): FanOutDeps => {
  const arranque = Date.now();
  return {
    negocios: () => liveBusinessIds(meteringDb()),
    generar: (businessId, now) => generarParaNegocio(businessId, { now }),
    report: reportError,
    limiteMs: LIMITE_MS,
    transcurrido: () => Date.now() - arranque,
  };
};
