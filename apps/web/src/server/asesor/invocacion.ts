import 'server-only';

import { cronAuth, cronRefusal, cronReply } from '../cron';
import { reportError, type ReportScope } from '../observability/report';
import { generarParaNegocio, type GeneracionResultado } from './runtime';

/**
 * The HTTP shape of one Asesor generation (P-30, ADR-056): **one business per
 * invocation**, guarded by the same `CRON_SECRET` every scheduled portal route
 * shares. The caller names the business; this never picks one, and never loops
 * over tenants — that is ADR-056's structural requirement.
 *
 * It lives beside the route rather than inside it so the contract — who may
 * call, what a nameless request answers, what a failed run answers — is
 * testable without Next's runtime and without a database.
 */
export interface InvocacionDeps {
  readonly secret: string | undefined;
  readonly now: () => Date;
  readonly generar: (businessId: string, now: Date) => Promise<GeneracionResultado>;
  readonly report: (error: unknown, scope: ReportScope) => void;
}

/** `{"businessId": "..."}`, or nothing this route can act on. */
async function businessIdDe(request: Request): Promise<string | null> {
  try {
    const cuerpo: unknown = await request.json();
    if (typeof cuerpo !== 'object' || cuerpo === null) return null;
    const id = (cuerpo as { businessId?: unknown }).businessId;
    return typeof id === 'string' && id !== '' ? id : null;
  } catch {
    // A malformed body is a bad request, not a crash: the enqueuer is told
    // what it sent was unreadable rather than that the Asesor is down.
    return null;
  }
}

export async function invocarAsesor(request: Request, deps: InvocacionDeps): Promise<Response> {
  // Authentication first, always: an unauthenticated caller must not learn
  // whether an id was well formed, and an unset secret closes the route
  // rather than opening it.
  const estado = cronAuth(request, deps.secret);
  if (estado !== 'ok') return cronRefusal(estado);

  const businessId = await businessIdDe(request);
  if (businessId === null) return cronReply(400, { error: 'business_id_requerido' });

  try {
    return cronReply(200, { ok: true, ...(await deps.generar(businessId, deps.now())) });
  } catch (error) {
    // One business failing is this business's failure. The enqueuer records
    // it and the next run recomputes — the insights are idempotent, so a
    // missed run costs nothing but a day's freshness.
    deps.report(error, { endpoint: 'cron/asesor', businessId });
    return cronReply(500, { error: 'asesor_failed', businessId });
  }
}

/** The production wiring. */
export const deps = (): InvocacionDeps => ({
  secret: process.env.CRON_SECRET,
  now: () => new Date(),
  generar: (businessId, now) => generarParaNegocio(businessId, { now }),
  report: reportError,
});
