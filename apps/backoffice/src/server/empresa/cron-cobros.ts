import type { ResultadoImportacion } from '@xangarro/application/corp';

import { rechazo, reply } from './cron-http';
import { mesesVecinos } from './movimiento-view';

/**
 * E-10's daily import of Xangarro's Stripe payments into the corp ledger,
 * each as its own «Cobro» (`importarCobros`). Last month is imported again
 * with this one: a payment can reach the tables a day late, and a refund of
 * last month's payment reverses its cobro. Answers only Vercel's cron.
 */
export interface CobrosCronDeps {
  readonly secret: string | undefined;
  /** `YYYY-MM-DD` in Mexico City. */
  readonly hoy: () => string;
  /** Null while «Empresa» has no database configured. */
  readonly importar:
    | ((input: {
        readonly periodos: readonly string[];
        readonly hoy: string;
      }) => Promise<ResultadoImportacion>)
    | null;
  readonly log?: (message: string, error: unknown) => void;
}

export async function handleCobrosCron(req: Request, deps: CobrosCronDeps): Promise<Response> {
  const refused = rechazo(req, deps.secret);
  if (refused !== null) return refused;
  if (deps.importar === null) return reply(200, { ok: true, reason: 'corp_disabled' });
  const hoy = deps.hoy();
  const mes = hoy.slice(0, 7);
  try {
    const r = await deps.importar({ periodos: [mesesVecinos(mes).anterior, mes], hoy });
    return reply(200, { ok: true, ...r });
  } catch (error) {
    (deps.log ?? console.error)('cobros: the import failed', error);
    return reply(500, { error: 'import_failed' });
  }
}
